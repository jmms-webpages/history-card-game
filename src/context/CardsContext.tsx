import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { Card, Pack, InventoryItem, CardRarity } from '../types';
import { INITIAL_CARDS, INITIAL_PACKS } from '../data/cards';
import { DEFAULT_GAME_SETTINGS } from '../data/initialCurriculum';
import { useAuth } from './AuthContext';
import { sounds } from '../utils/audio';
import { isFirebaseConfigured, db, doc, getDoc, setDoc, collection, getDocs } from '../firebase/config';

const HOLO_CHANCE = 0.1;
const HOLO_ELIGIBLE_RARITIES: CardRarity[] = ['Legendary', 'Mythical'];
// Matches the defensive cap in firestore.rules -- a generous ceiling, not
// a realistic one (a very engaged student pulling 3 packs/day for a full
// school year lands well under 3,000 cards).
const MAX_INVENTORY_ITEMS = 5000;

interface OpenPackResult {
  cards: (Card & { isHolo: boolean })[];
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
  hasHoloCopy: (cardId: string) => boolean;
  getHoloCopies: (cardId: string) => number;
  getPackCardPool: (pack: Pack) => Card[];
  stats: {
    totalCards: number;
    uniqueCards: number;
    totalInSet: number;
    completionPercentage: number;
    duplicatesCount: number;
    potentialDuplicateSellValue: number;
  };
  addCustomCard: (card: Omit<Card, 'cardId'>) => void;
  toggleCardActive: (cardId: string) => void;
  togglePackActive: (packId: string) => void;
}

const CardsContext = createContext<CardsContextType | undefined>(undefined);

const LOCAL_STORAGE_CARDS_KEY = 'history_card_quest_cards';
const LOCAL_STORAGE_PACKS_KEY = 'history_card_quest_pack_overrides';
const LOCAL_STORAGE_INVENTORY_PREFIX = 'history_card_quest_inv_';

export const CardsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { userProfile, updateCoins, updateUserProfile } = useAuth();
  const inventoryRef = React.useRef<InventoryItem[]>([]);

  const [cards, setCards] = useState<Card[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_CARDS_KEY);
      if (saved) {
        const parsed: Card[] = JSON.parse(saved);
        const existingIds = new Set(parsed.map(c => c.cardId));
        const missingInitials = INITIAL_CARDS.filter(c => !existingIds.has(c.cardId));
        return missingInitials.length > 0 ? [...parsed, ...missingInitials] : parsed;
      }
    } catch {
      // ignore
    }
    return INITIAL_CARDS;
  });

  useEffect(() => {
    if (!isFirebaseConfigured || !db || !collection || !getDocs) return;
    (async () => {
      try {
        const cardsColl = collection(db, 'cards');
        const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 2500));
        const snap = await Promise.race([getDocs(cardsColl), timeout]) as any;
        if (snap && snap.docs && snap.docs.length > 0) {
          const overrides = new Map<string, boolean>();
          snap.docs.forEach((d: any) => {
            const data = d.data();
            if (data?.cardId && typeof data.active === 'boolean') {
              overrides.set(data.cardId, data.active);
            }
          });
          setCards(prev => {
            const updated = prev.map(c => overrides.has(c.cardId) ? { ...c, active: overrides.get(c.cardId)! } : c);
            try {
              localStorage.setItem(LOCAL_STORAGE_CARDS_KEY, JSON.stringify(updated));
            } catch {}
            return updated;
          });
        }
      } catch (e) {
        console.warn('Card catalog fetch notice (using cached cards):', e);
      }
    })();
  }, []);

  const [packOverrides, setPackOverrides] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_PACKS_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    if (!isFirebaseConfigured || !db || !collection || !getDocs) return;
    (async () => {
      try {
        const packsColl = collection(db, 'packs');
        const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 2500));
        const snap = await Promise.race([getDocs(packsColl), timeout]) as any;
        if (snap && snap.docs && snap.docs.length > 0) {
          const overrides: Record<string, boolean> = {};
          snap.docs.forEach((d: any) => {
            const data = d.data();
            if (data?.packId && typeof data.active === 'boolean') {
              overrides[data.packId] = data.active;
            }
          });
          setPackOverrides(overrides);
          try {
            localStorage.setItem(LOCAL_STORAGE_PACKS_KEY, JSON.stringify(overrides));
          } catch {}
        }
      } catch (e) {
        console.warn('Pack availability fetch notice (using cached packs):', e);
      }
    })();
  }, []);

  const togglePackActive = (packId: string) => {
    const currentPack = INITIAL_PACKS.find(p => p.packId === packId);
    const currentlyActive = packOverrides[packId] ?? currentPack?.active ?? true;
    const newActive = !currentlyActive;

    setPackOverrides(prev => {
      const next = { ...prev, [packId]: newActive };
      try {
        localStorage.setItem(LOCAL_STORAGE_PACKS_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });

    if (isFirebaseConfigured && db && doc && setDoc) {
      const packRef = doc(db, 'packs', packId);
      setDoc(packRef, { packId, active: newActive }, { merge: true }).catch(e => {
        console.warn('Pack availability sync notice:', e);
      });
    }
  };

  const getPackCardPoolInternal = (pack: Pack, activeCards: Card[]): Card[] => {
    return activeCards.filter(c =>
      c.packTheme === pack.theme ||
      (pack.packId.startsWith('pack-unit-') && c.unitId === pack.packId.replace('pack-', ''))
    );
  };

  const getPackCardPool = (pack: Pack): Card[] => {
    const activeCards = cards.filter(c => c.active);
    const pool = getPackCardPoolInternal(pack, activeCards);
    return pool.length > 0 ? pool : activeCards;
  };

  const packs = useMemo<Pack[]>(() => {
    const activeCards = cards.filter(c => c.active);
    return INITIAL_PACKS.map(pack => {
      const pool = getPackCardPoolInternal(pack, activeCards);
      const totalPossible = pool.length > 0 ? pool.length : activeCards.length;
      const active = packOverrides[pack.packId] ?? pack.active;
      return {
        ...pack,
        cardCount: totalPossible,
        active
      };
    });
  }, [cards, packOverrides]);

  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loadingInventory, setLoadingInventory] = useState<boolean>(true);

  // The entire card collection lives in ONE document now
  // (users/{uid}/collection/binder) -- exactly 1 read per session load,
  // regardless of how large the collection grows over the year.
  useEffect(() => {
    if (!userProfile?.uid) {
      inventoryRef.current = [];
      setInventory([]);
      setLoadingInventory(false);
      return;
    }

    const uid = userProfile.uid;
    const storageKey = `${LOCAL_STORAGE_INVENTORY_PREFIX}${uid}`;

    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const localInv: InventoryItem[] = JSON.parse(saved);
        inventoryRef.current = localInv;
        setInventory(localInv);
      }
    } catch {
      // ignore
    }

    if (isFirebaseConfigured && db && doc && getDoc) {
      (async () => {
        try {
          const binderRef = doc(db, 'users', uid, 'collection', 'binder');
          const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 2000));
          const snap = await Promise.race([getDoc(binderRef), timeout]) as any;
          if (snap && typeof snap.exists === 'function' && snap.exists()) {
            const data = snap.data() as any;
            const items: InventoryItem[] = Array.isArray(data?.items) ? data.items : [];
            inventoryRef.current = items;
            setInventory(items);
            try {
              localStorage.setItem(storageKey, JSON.stringify(items));
            } catch {
              // ignore
            }
          }
        } catch (e) {
          console.warn('Binder fetch notice (using cached collection):', e);
        } finally {
          setLoadingInventory(false);
        }
      })();
    } else {
      setLoadingInventory(false);
    }
  }, [userProfile?.uid]);

  const saveInventory = (newInv: InventoryItem[]) => {
    inventoryRef.current = newInv;
    setInventory(newInv);
    if (!userProfile?.uid) return;

    const uid = userProfile.uid;
    const storageKey = `${LOCAL_STORAGE_INVENTORY_PREFIX}${uid}`;
    try {
      localStorage.setItem(storageKey, JSON.stringify(newInv));
    } catch {
      // ignore
    }

    // ONE write for the whole collection -- this replaces what used to be
    // up to 5+ separate writes every time a pack was opened.
    if (isFirebaseConfigured && db && doc && setDoc) {
      const binderRef = doc(db, 'users', uid, 'collection', 'binder');
      setDoc(binderRef, { items: newInv.slice(0, MAX_INVENTORY_ITEMS) }).catch(e => {
        console.warn('Binder sync notice:', e);
      });
    }

    const uniqueIds = new Set(newInv.map(i => i.cardId));
    if (updateUserProfile) {
      updateUserProfile({
        totalCardsCollected: newInv.length,
        uniqueCardsCollected: uniqueIds.size
      });
    }
  };

  const cardMap = useMemo(() => {
    const map = new Map<string, Card>();
    cards.forEach(c => map.set(c.cardId, c));
    return map;
  }, [cards]);

  const getCardById = (cardId: string): Card | undefined => {
    return cardMap.get(cardId);
  };

  const inventoryCards = useMemo(() => {
    return inventory
      .map(item => {
        const card = cardMap.get(item.cardId);
        return card ? { ...item, card } : null;
      })
      .filter((item): item is InventoryItem & { card: Card } => item !== null);
  }, [inventory, cardMap]);

  const ownershipMap = useMemo(() => {
    const map = new Map<string, number>();
    inventory.forEach(item => {
      map.set(item.cardId, (map.get(item.cardId) || 0) + 1);
    });
    return map;
  }, [inventory]);

  const holoOwnershipMap = useMemo(() => {
    const map = new Map<string, number>();
    inventory.forEach(item => {
      if (item.isHolo) {
        map.set(item.cardId, (map.get(item.cardId) || 0) + 1);
      }
    });
    return map;
  }, [inventory]);

  const isCardOwned = (cardId: string): boolean => {
    return (ownershipMap.get(cardId) || 0) > 0;
  };

  const getCardCopies = (cardId: string): number => {
    return ownershipMap.get(cardId) || 0;
  };

  const hasHoloCopy = (cardId: string): boolean => {
    return (holoOwnershipMap.get(cardId) || 0) > 0;
  };

  const getHoloCopies = (cardId: string): number => {
    return holoOwnershipMap.get(cardId) || 0;
  };

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

  const RARITY_ORDER: CardRarity[] = ['Mythical', 'Legendary', 'Rare', 'Uncommon', 'Common'];

  const drawCard = (rarity: CardRarity, pack: Pack): Card => {
    const activeCards = cards.filter(c => c.active);
    const packPool = getPackCardPoolInternal(pack, activeCards);
    const scopedPool = packPool.length > 0 ? packPool : activeCards;

    let candidates = scopedPool.filter(c => c.rarity === rarity);

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

    if (candidates.length === 0) {
      candidates = scopedPool;
    }

    const randomIndex = Math.floor(Math.random() * candidates.length);
    return candidates[randomIndex];
  };

  const openPack = async (packId: string): Promise<OpenPackResult> => {
    const pack = packs.find(p => p.packId === packId) || packs[0];
    const cost = pack.cost;

    if (!pack.active) {
      throw new Error('This pack is currently locked by your teacher. Check back once your class reaches that unit!');
    }

    if (!userProfile || (userProfile.coins || 0) < cost) {
      throw new Error(`Insufficient coins. You need ${cost} coins to open this pack.`);
    }

    await updateCoins(-cost);
    sounds.playPackRip();

    const pulledCards: Card[] = [];

    for (let i = 0; i < 4; i++) {
      const rarity = rollRarity(DEFAULT_GAME_SETTINGS.rarityProbabilities);
      const card = drawCard(rarity, pack);
      pulledCards.push(card);
    }

    const guaranteedRarity = rollRarity(DEFAULT_GAME_SETTINGS.guaranteedSlotProbabilities);
    const guaranteedCard = drawCard(guaranteedRarity, pack);
    pulledCards.push(guaranteedCard);

    let newCardsCount = 0;
    let duplicateCardsCount = 0;
    const now = new Date().toISOString();
    const newInventoryItems: InventoryItem[] = [];
    const freshOwnership = new Map<string, number>();
    inventoryRef.current.forEach(item => {
      freshOwnership.set(item.cardId, (freshOwnership.get(item.cardId) || 0) + 1);
    });
    const currentOwnership = freshOwnership;
    const pulledHoloFlags: boolean[] = [];

    pulledCards.forEach((card, idx) => {
      const currentCount = currentOwnership.get(card.cardId) ?? 0;
      const isDuplicate = currentCount > 0;
      if (isDuplicate) {
        duplicateCardsCount++;
      } else {
        newCardsCount++;
      }
      currentOwnership.set(card.cardId, currentCount + 1);

      const isHolo = HOLO_ELIGIBLE_RARITIES.includes(card.rarity) && Math.random() < HOLO_CHANCE;
      pulledHoloFlags.push(isHolo);

      const instanceId = `inv-${Date.now()}-${Math.random().toString(36).substring(2, 7)}-${idx}`;
      newInventoryItems.push({
        instanceId,
        cardId: card.cardId,
        obtainedAt: now,
        isDuplicate,
        isHolo
      });
    });

    const updatedInventory = [...inventoryRef.current, ...newInventoryItems];
    saveInventory(updatedInventory);

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
      cards: pulledCards.map((c, idx) => ({ ...c, isHolo: pulledHoloFlags[idx] })),
      newCardsCount,
      duplicateCardsCount,
      packName: pack.name
    };
  };

  const sellDuplicate = async (instanceId: string): Promise<number> => {
    const itemIndex = inventory.findIndex(i => i.instanceId === instanceId);
    if (itemIndex === -1) return 0;

    const item = inventory[itemIndex];
    const card = cardMap.get(item.cardId);
    if (!card) return 0;

    const totalCopies = ownershipMap.get(item.cardId) || 0;
    if (totalCopies <= 1) {
      throw new Error("You only have one copy of this card! The last copy is protected in your binder.");
    }

    const sellValue = DEFAULT_GAME_SETTINGS.duplicateSellValues[card.rarity] || 5;

    const updated = [...inventory];
    updated.splice(itemIndex, 1);
    saveInventory(updated);

    await updateCoins(sellValue);
    sounds.playCoin();

    return sellValue;
  };

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

    saveInventory(keepItems);
    await updateCoins(totalCoins);
    sounds.playCoin();

    return {
      soldCount: sellItems.length,
      coinsEarned: totalCoins
    };
  };

  const stats = useMemo(() => {
    const totalCards = inventory.length;
    const uniqueCards = ownershipMap.size;
    const activeCards = cards.filter(c => c.active);
    const totalInSet = activeCards.length;
    const completionPercentage = totalInSet > 0 ? Math.round((uniqueCards / totalInSet) * 100) : 0;

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
    let newActive = true;
    const updated = cards.map(c => {
      if (c.cardId === cardId) {
        newActive = !c.active;
        return { ...c, active: newActive };
      }
      return c;
    });
    setCards(updated);
    try {
      localStorage.setItem(LOCAL_STORAGE_CARDS_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }

    if (isFirebaseConfigured && db && doc && setDoc) {
      const cardRef = doc(db, 'cards', cardId);
      setDoc(cardRef, { cardId, active: newActive }, { merge: true }).catch(e => {
        console.warn('Card catalog sync notice:', e);
      });
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
      hasHoloCopy,
      getHoloCopies,
      getPackCardPool,
      stats,
      addCustomCard,
      toggleCardActive,
      togglePackActive
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