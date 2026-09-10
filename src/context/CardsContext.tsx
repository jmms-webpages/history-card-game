import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { Card, Pack, InventoryItem, CardRarity } from '../types';
import { INITIAL_CARDS, INITIAL_PACKS } from '../data/cards';
import { DEFAULT_GAME_SETTINGS } from '../data/initialCurriculum';
import { useAuth } from './AuthContext';
import { sounds } from '../utils/audio';
import { isFirebaseConfigured, db, doc, getDocs, collection, setDoc, deleteDoc } from '../firebase/config';

interface OpenPackResult {
  cards: Card[];
  newCardsCount: number;
  duplicateCardsCount: number;
  packName: string;
}

interface CardsContextType {
  cards: Card[];
  packs: Pack[];
  inventory: InventoryItem[];
  inventoryCards: (InventoryItem & { card: Card })[];
  loadingInventory: boolean;
  openPack: (packId: string) => Promise<OpenPackResult>;
  sellDuplicate: (instanceId: string) => Promise<number>;
  sellAllDuplicates: () => Promise<{ soldCount: number; coinsEarned: number }>;
  getCardById: (cardId: string) => Card | undefined;
  isCardOwned: (cardId: string) => boolean;
  getCardCopies: (cardId: string) => number;
  stats: {
    totalCards: number;
    uniqueCards: number;
    totalInSet: number;
    completionPercentage: number;
    duplicatesCount: number;
    potentialDuplicateSellValue: number;
  };
  exchangeCardsForTrade: (cardsToGiveIds: string[], cardsToReceiveIds: string[]) => Promise<boolean>;
  addCustomCard: (card: Omit<Card, 'cardId'>) => void;
  toggleCardActive: (cardId: string) => void;
}

const CardsContext = createContext<CardsContextType | undefined>(undefined);

const LOCAL_STORAGE_CARDS_KEY = 'history_card_quest_cards';
const LOCAL_STORAGE_INVENTORY_PREFIX = 'history_card_quest_inv_';

export const CardsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { userProfile, updateCoins, updateUserProfile } = useAuth();
  
  // Custom or loaded cards
  const [cards, setCards] = useState<Card[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_CARDS_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // ignore
    }
    return INITIAL_CARDS;
  });

  const [packs] = useState<Pack[]>(INITIAL_PACKS);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loadingInventory, setLoadingInventory] = useState<boolean>(true);

  // Load user inventory whenever userProfile changes
  useEffect(() => {
    if (!userProfile?.uid) {
      setInventory([]);
      setLoadingInventory(false);
      return;
    }

    const uid = userProfile.uid;
    const storageKey = `${LOCAL_STORAGE_INVENTORY_PREFIX}${uid}`;
    
    // Initial read from localStorage for instant display
    let localInv: InventoryItem[] = [];
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        localInv = JSON.parse(saved);
        setInventory(localInv);
      }
    } catch {
      // ignore
    }

    // If live Firebase is configured, attempt gentle async read with timeout
    if (isFirebaseConfigured && db && collection && getDocs) {
      const fetchFirestoreInv = async () => {
        try {
          const invColl = collection(db, 'users', uid, 'inventory');
          const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 2000));
          const snap = await Promise.race([getDocs(invColl), timeout]) as any;
          if (snap && snap.docs && snap.docs.length > 0) {
            const firestoreItems: InventoryItem[] = snap.docs.map((d: any) => d.data() as InventoryItem);
            setInventory(firestoreItems);
            try {
              localStorage.setItem(storageKey, JSON.stringify(firestoreItems));
            } catch {
              // ignore
            }
          }
        } catch (e) {
          console.warn("Async inventory fetch notice:", e);
        } finally {
          setLoadingInventory(false);
        }
      };
      fetchFirestoreInv();
    } else {
      setLoadingInventory(false);
    }
  }, [userProfile?.uid]);

  // Persist inventory
  const saveInventory = (newInv: InventoryItem[]) => {
    setInventory(newInv);
    if (!userProfile?.uid) return;

    const uid = userProfile.uid;
    const storageKey = `${LOCAL_STORAGE_INVENTORY_PREFIX}${uid}`;
    try {
      localStorage.setItem(storageKey, JSON.stringify(newInv));
    } catch {
      // ignore
    }

    // Update profile metrics
    const uniqueIds = new Set(newInv.map(i => i.cardId));
    if (updateUserProfile) {
      updateUserProfile({
        // keep profile sync clean
      });
    }
  };

  // Card lookup map
  const cardMap = useMemo(() => {
    const map = new Map<string, Card>();
    cards.forEach(c => map.set(c.cardId, c));
    return map;
  }, [cards]);

  const getCardById = (cardId: string): Card | undefined => {
    return cardMap.get(cardId);
  };

  // Enriched inventory items
  const inventoryCards = useMemo(() => {
    return inventory
      .map(item => {
        const card = cardMap.get(item.cardId);
        return card ? { ...item, card } : null;
      })
      .filter((item): item is InventoryItem & { card: Card } => item !== null);
  }, [inventory, cardMap]);

  // Inventory count map
  const ownershipMap = useMemo(() => {
    const map = new Map<string, number>();
    inventory.forEach(item => {
      map.set(item.cardId, (map.get(item.cardId) || 0) + 1);
    });
    return map;
  }, [inventory]);

  const isCardOwned = (cardId: string): boolean => {
    return (ownershipMap.get(cardId) || 0) > 0;
  };

  const getCardCopies = (cardId: string): number => {
    return ownershipMap.get(cardId) || 0;
  };

  // Roll rarity based on weights
  const rollRarity = (weights: Record<CardRarity, number>): CardRarity => {
    const rand = Math.random();
    let cumulative = 0;
    
    const rarities: CardRarity[] = ['Mythical', 'Legendary', 'Rare', 'Uncommon', 'Common'];
    for (const r of rarities) {
      cumulative += weights[r];
      if (rand <= cumulative) {
        return r;
      }
    }
    return 'Common';
  };

  // Rarity tiers ordered highest -> lowest, used to find the nearest
  // available rarity WITHOUT ever leaving the pack's own card pool.
  const RARITY_ORDER: CardRarity[] = ['Mythical', 'Legendary', 'Rare', 'Uncommon', 'Common'];

  // The set of cards that actually belong to a given pack. A card belongs
  // to a pack if its packTheme matches the pack's theme, or (as a fallback
  // link) its unitId matches the unit a "pack-unit-N" pack represents.
  const getPackCardPool = (pack: Pack, activeCards: Card[]): Card[] => {
    return activeCards.filter(c =>
      c.packTheme === pack.theme ||
      (pack.packId.startsWith('pack-unit-') && c.unitId === pack.packId.replace('pack-', ''))
    );
  };

  // Draw 1 card for this pack. Cards are ALWAYS drawn from the pack's own
  // pool -- a pack can never hand out a card from a different pack/theme.
  // If the pack itself has no linked cards at all (e.g. a curated
  // "all eras" pack), we intentionally draw from every active card instead,
  // since that pack has no card pool of its own by design.
  const drawCard = (rarity: CardRarity, pack: Pack): Card => {
    const activeCards = cards.filter(c => c.active);
    const packPool = getPackCardPool(pack, activeCards);
    const scopedPool = packPool.length > 0 ? packPool : activeCards;

    // 1. Try the exact rolled rarity within this pack's own cards.
    let candidates = scopedPool.filter(c => c.rarity === rarity);

    // 2. If this pack doesn't stock that exact rarity, step to the nearest
    // available rarity -- checking one tier down before one tier up at each
    // step -- but never leave the pack's own pool.
    if (candidates.length === 0) {
      const startIndex = RARITY_ORDER.indexOf(rarity);
      for (let offset = 1; offset < RARITY_ORDER.length && candidates.length === 0; offset++) {
        const oneTierDown = RARITY_ORDER[startIndex + offset];
        const oneTierUp = RARITY_ORDER[startIndex - offset];
        if (oneTierDown) {
          candidates = scopedPool.filter(c => c.rarity === oneTierDown);
        }
        if (candidates.length === 0 && oneTierUp) {
          candidates = scopedPool.filter(c => c.rarity === oneTierUp);
        }
      }
    }

    // 3. Absolute last resort (a pack with active cards of no rarity at
    // all is misconfigured) -- still stay within the pack's own pool.
    if (candidates.length === 0) {
      candidates = scopedPool;
    }

    const randomIndex = Math.floor(Math.random() * candidates.length);
    return candidates[randomIndex];
  };

  // Open 5-Card Booster Pack
  const openPack = async (packId: string): Promise<OpenPackResult> => {
    const pack = packs.find(p => p.packId === packId) || packs[0];
    const cost = pack.cost;

    // Check user coins
    if (!userProfile || (userProfile.coins || 0) < cost) {
      throw new Error(`Insufficient coins. You need ${cost} coins to open this pack.`);
    }

    // Deduct coins
    await updateCoins(-cost);

    // Sound effect: pack tear
    sounds.playPackRip();

    // Roll 5 cards: 4 standard rolls + 1 guaranteed Uncommon-or-better slot
    const pulledCards: Card[] = [];
    
    // Slot 1-4: Standard rolls
    for (let i = 0; i < 4; i++) {
      const rarity = rollRarity(DEFAULT_GAME_SETTINGS.rarityProbabilities);
      const card = drawCard(rarity, pack);
      pulledCards.push(card);
    }

    // Slot 5: Guaranteed Uncommon-or-better slot
    const guaranteedRarity = rollRarity(DEFAULT_GAME_SETTINGS.guaranteedSlotProbabilities);
    const guaranteedCard = drawCard(guaranteedRarity, pack);
    pulledCards.push(guaranteedCard);

    // Track new vs duplicates
    let newCardsCount = 0;
    let duplicateCardsCount = 0;
    const now = new Date().toISOString();
    const newInventoryItems: InventoryItem[] = [];
    const currentOwnership = new Map<string, number>(ownershipMap);

    pulledCards.forEach((card, idx) => {
      const currentCount = currentOwnership.get(card.cardId) ?? 0;
      const isDuplicate = currentCount > 0;
      if (isDuplicate) {
        duplicateCardsCount++;
      } else {
        newCardsCount++;
      }
      currentOwnership.set(card.cardId, currentCount + 1);

      const instanceId = `inv-${Date.now()}-${Math.random().toString(36).substring(2, 7)}-${idx}`;
      newInventoryItems.push({
        instanceId,
        cardId: card.cardId,
        obtainedAt: now,
        isDuplicate
      });

      // Try async write to Firestore if configured
      if (isFirebaseConfigured && db && doc && setDoc && userProfile?.uid) {
        const itemRef = doc(db, 'users', userProfile.uid, 'inventory', instanceId);
        setDoc(itemRef, {
          instanceId,
          cardId: card.cardId,
          obtainedAt: now,
          isDuplicate
        }).catch(() => {});
      }
    });

    // Save updated inventory
    const updatedInventory = [...inventory, ...newInventoryItems];
    saveInventory(updatedInventory);

    // Check if any high rarity card was pulled for fanfare sound
    const hasMythical = pulledCards.some(c => c.rarity === 'Mythical');
    const hasLegendary = pulledCards.some(c => c.rarity === 'Legendary');
    const hasRare = pulledCards.some(c => c.rarity === 'Rare');

    if (hasMythical) {
      setTimeout(() => sounds.playFanfare('Mythical'), 400);
    } else if (hasLegendary) {
      setTimeout(() => sounds.playFanfare('Legendary'), 400);
    } else if (hasRare) {
      setTimeout(() => sounds.playFanfare('Rare'), 400);
    } else {
      setTimeout(() => sounds.playCardFlip(), 200);
    }

    return {
      cards: pulledCards,
      newCardsCount,
      duplicateCardsCount,
      packName: pack.name
    };
  };

  // Sell 1 duplicate card
  const sellDuplicate = async (instanceId: string): Promise<number> => {
    const itemIndex = inventory.findIndex(i => i.instanceId === instanceId);
    if (itemIndex === -1) return 0;

    const item = inventory[itemIndex];
    const card = cardMap.get(item.cardId);
    if (!card) return 0;

    // Verify user owns at least 2 copies before allowing duplicate sell
    const totalCopies = ownershipMap.get(item.cardId) || 0;
    if (totalCopies <= 1) {
      throw new Error("You only have one copy of this card! The last copy is protected in your binder.");
    }

    const sellValue = DEFAULT_GAME_SETTINGS.duplicateSellValues[card.rarity] || 5;

    // Remove from inventory
    const updated = [...inventory];
    updated.splice(itemIndex, 1);
    saveInventory(updated);

    // Award coins
    await updateCoins(sellValue);
    sounds.playCoin();

    // Async delete from Firestore if active
    if (isFirebaseConfigured && db && doc && deleteDoc && userProfile?.uid) {
      const itemRef = doc(db, 'users', userProfile.uid, 'inventory', instanceId);
      deleteDoc(itemRef).catch(() => {});
    }

    return sellValue;
  };

  // Sell all duplicates across whole binder
  const sellAllDuplicates = async (): Promise<{ soldCount: number; coinsEarned: number }> => {
    const keepSet = new Set<string>();
    const keepItems: InventoryItem[] = [];
    const sellItems: InventoryItem[] = [];
    let totalCoins = 0;

    for (const item of inventory) {
      if (!keepSet.has(item.cardId)) {
        keepSet.add(item.cardId);
        keepItems.push(item);
      } else {
        sellItems.push(item);
        const card = cardMap.get(item.cardId);
        const value = card ? (DEFAULT_GAME_SETTINGS.duplicateSellValues[card.rarity] || 5) : 5;
        totalCoins += value;
      }
    }

    if (sellItems.length === 0) {
      return { soldCount: 0, coinsEarned: 0 };
    }

    // Save pruned inventory
    saveInventory(keepItems);

    // Award all coins
    await updateCoins(totalCoins);
    sounds.playCoin();

    // Delete sold instances from Firestore in background
    if (isFirebaseConfigured && db && doc && deleteDoc && userProfile?.uid) {
      sellItems.forEach(item => {
        const itemRef = doc(db, 'users', userProfile.uid, 'inventory', item.instanceId);
        deleteDoc(itemRef).catch(() => {});
      });
    }

    return {
      soldCount: sellItems.length,
      coinsEarned: totalCoins
    };
  };

  // Atomic exchange of cards for peer trade
  const exchangeCardsForTrade = async (cardsToGiveIds: string[], cardsToReceiveIds: string[]): Promise<boolean> => {
    // 1. Verify user still possesses all cardsToGiveIds
    const remainingToGive = [...cardsToGiveIds];
    const currentInv = [...inventory];
    const itemsToRemoveIndices: number[] = [];

    for (const giveCardId of remainingToGive) {
      const idx = currentInv.findIndex((item, i) => item.cardId === giveCardId && !itemsToRemoveIndices.includes(i));
      if (idx === -1) {
        throw new Error(`You no longer possess the card required for this trade: ${giveCardId}`);
      }
      itemsToRemoveIndices.push(idx);
    }

    // 2. Remove the given cards
    const updatedInventory = currentInv.filter((_, idx) => !itemsToRemoveIndices.includes(idx));

    // 3. Add the received cards
    const now = new Date().toISOString();
    cardsToReceiveIds.forEach((receiveCardId, i) => {
      const card = cardMap.get(receiveCardId);
      const isDuplicate = updatedInventory.some(item => item.cardId === receiveCardId);
      const instanceId = `inst-trade-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 7)}`;
      const newItem: InventoryItem = {
        instanceId,
        cardId: receiveCardId,
        obtainedAt: now,
        isDuplicate,
        card
      };
      updatedInventory.push(newItem);

      // Async Firestore write if configured
      if (isFirebaseConfigured && db && doc && setDoc && userProfile?.uid) {
        const itemRef = doc(db, 'users', userProfile.uid, 'inventory', instanceId);
        setDoc(itemRef, {
          instanceId,
          cardId: receiveCardId,
          obtainedAt: now,
          isDuplicate,
          obtainedVia: 'trade'
        }).catch(() => {});
      }
    });

    // 4. Async delete removed items from Firestore
    if (isFirebaseConfigured && db && doc && deleteDoc && userProfile?.uid) {
      itemsToRemoveIndices.forEach(idx => {
        const item = currentInv[idx];
        if (item) {
          const itemRef = doc(db, 'users', userProfile.uid, 'inventory', item.instanceId);
          deleteDoc(itemRef).catch(() => {});
        }
      });
    }

    // 5. Commit state & localStorage
    saveInventory(updatedInventory);
    return true;
  };

  // Stats calculation
  const stats = useMemo(() => {
    const totalCards = inventory.length;
    const uniqueCards = ownershipMap.size;
    const activeCards = cards.filter(c => c.active);
    const totalInSet = activeCards.length;
    const completionPercentage = totalInSet > 0 ? Math.round((uniqueCards / totalInSet) * 100) : 0;
    
    // Duplicates calculation
    let duplicatesCount = 0;
    let potentialDuplicateSellValue = 0;
    const countedCards = new Set<string>();

    inventory.forEach(item => {
      if (!countedCards.has(item.cardId)) {
        countedCards.add(item.cardId);
      } else {
        duplicatesCount++;
        const card = cardMap.get(item.cardId);
        if (card) {
          potentialDuplicateSellValue += DEFAULT_GAME_SETTINGS.duplicateSellValues[card.rarity] || 5;
        }
      }
    });

    return {
      totalCards,
      uniqueCards,
      totalInSet,
      completionPercentage,
      duplicatesCount,
      potentialDuplicateSellValue
    };
  }, [inventory, ownershipMap, cards, cardMap]);

  // Admin / Teacher functions
  const addCustomCard = (cardData: Omit<Card, 'cardId'>) => {
    const newCardId = `card-custom-${Date.now()}`;
    const newCard: Card = {
      ...cardData,
      cardId: newCardId
    };
    const updated = [newCard, ...cards];
    setCards(updated);
    try {
      localStorage.setItem(LOCAL_STORAGE_CARDS_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const toggleCardActive = (cardId: string) => {
    const updated = cards.map(c => c.cardId === cardId ? { ...c, active: !c.active } : c);
    setCards(updated);
    try {
      localStorage.setItem(LOCAL_STORAGE_CARDS_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  return (
    <CardsContext.Provider value={{
      cards,
      packs,
      inventory,
      inventoryCards,
      loadingInventory,
      openPack,
      sellDuplicate,
      sellAllDuplicates,
      getCardById,
      isCardOwned,
      getCardCopies,
      stats,
      exchangeCardsForTrade,
      addCustomCard,
      toggleCardActive
    }}>
      {children}
    </CardsContext.Provider>
  );
};

export const useCards = () => {
  const context = useContext(CardsContext);
  if (!context) {
    throw new Error('useCards must be used within a CardsProvider');
  }
  return context;
};
