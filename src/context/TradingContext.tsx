import React, { createContext, useContext, useState, useEffect } from 'react';
import { Trade, Card } from '../types';
import { useAuth } from './AuthContext';
import { useCards } from './CardsContext';
import { sounds } from '../utils/audio';
import { isFirebaseConfigured, db, doc, collection, getDocs, setDoc } from '../firebase/config';

export interface ClassmatePeer {
  uid: string;
  displayName: string;
  avatar: string;
  title: string;
  availableCardIds: string[];
}

interface TradingContextType {
  trades: Trade[];
  classmates: ClassmatePeer[];
  incomingTrades: Trade[];
  outgoingTrades: Trade[];
  tradeHistory: Trade[];
  loadingTrades: boolean;
  proposeTrade: (
    receiverId: string,
    receiverName: string,
    offeredCardIds: string[],
    requestedCardIds: string[]
  ) => Promise<Trade>;
  acceptTrade: (tradeId: string) => Promise<boolean>;
  declineTrade: (tradeId: string) => Promise<boolean>;
  cancelTrade: (tradeId: string) => Promise<boolean>;
}

const TradingContext = createContext<TradingContextType | undefined>(undefined);

const LOCAL_STORAGE_TRADES_PREFIX = 'history_card_quest_trades_';

// Default classroom peer students for collaborative trading simulation
const DEFAULT_CLASSMATES: ClassmatePeer[] = [
  {
    uid: 'peer-maya-8th',
    displayName: 'Maya Patel',
    avatar: 'pioneer',
    title: 'Ohio Canal Surveyor',
    availableCardIds: ['card-ohio-constitution', 'card-erie-canal', 'card-ordinance-1787', 'card-marbury-madison']
  },
  {
    uid: 'peer-lucas-8th',
    displayName: 'Lucas Miller',
    avatar: 'general',
    title: 'Continental Veteran',
    availableCardIds: ['card-valley-forge', 'card-common-sense', 'card-battle-yorktown', 'card-boston-tea-party']
  },
  {
    uid: 'peer-emma-8th',
    displayName: 'Emma Johnson',
    avatar: 'philosopher',
    title: 'Constitutional Scholar',
    availableCardIds: ['card-bill-of-rights', 'card-great-compromise', 'card-federalist-papers', 'card-three-fifths']
  },
  {
    uid: 'peer-noah-8th',
    displayName: 'Noah Davis',
    avatar: 'orator',
    title: 'Frontier Orator',
    availableCardIds: ['card-lewis-clark', 'card-monroe-doctrine', 'card-trail-of-tears', 'card-war-1812']
  }
];

export const TradingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { userProfile } = useAuth();
  const { exchangeCardsForTrade, getCardById } = useCards();

  const [trades, setTrades] = useState<Trade[]>([]);
  const [classmates, setClassmates] = useState<ClassmatePeer[]>(DEFAULT_CLASSMATES);
  const [loadingTrades, setLoadingTrades] = useState<boolean>(true);

  // Load trades from localStorage and initial seeds
  useEffect(() => {
    if (!userProfile?.uid) {
      setTrades([]);
      setLoadingTrades(false);
      return;
    }

    const storageKey = `${LOCAL_STORAGE_TRADES_PREFIX}${userProfile.uid}`;
    let loadedTrades: Trade[] = [];

    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        loadedTrades = JSON.parse(saved);
      } else {
        // Seed an initial friendly incoming trade from Maya so the student immediately has a demo trade to review!
        const initialIncomingTrade: Trade = {
          tradeId: `trade-welcome-${Date.now()}`,
          senderId: 'peer-maya-8th',
          senderName: 'Maya Patel (Ohio Canal Surveyor)',
          receiverId: userProfile.uid,
          receiverName: userProfile.displayName,
          offeredCardIds: ['card-ordinance-1787'],
          requestedCardIds: ['card-stamp-act'],
          status: 'pending',
          createdAt: new Date(Date.now() - 3600000).toISOString(),
          updatedAt: new Date(Date.now() - 3600000).toISOString()
        };
        loadedTrades = [initialIncomingTrade];
        localStorage.setItem(storageKey, JSON.stringify(loadedTrades));
      }
    } catch {
      // ignore
    }

    setTrades(loadedTrades);
    setLoadingTrades(false);

    // Optional Firestore sync
    if (isFirebaseConfigured && db && collection && getDocs) {
      const fetchFirebaseTrades = async () => {
        try {
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error("Firebase trades timeout")), 3000)
          );
          const tradesSnap = await Promise.race([
            getDocs(collection(db, 'trades')),
            timeoutPromise
          ]) as any;

          if (tradesSnap && !tradesSnap.empty) {
            const remoteTrades: Trade[] = [];
            tradesSnap.forEach((d: any) => {
              const data = d.data() as Trade;
              if (data.senderId === userProfile.uid || data.receiverId === userProfile.uid) {
                remoteTrades.push(data);
              }
            });
            if (remoteTrades.length > 0) {
              setTrades(remoteTrades);
              try {
                localStorage.setItem(storageKey, JSON.stringify(remoteTrades));
              } catch {}
            }
          }
        } catch {
          // Gracefully fallback to localStorage
        }
      };
      fetchFirebaseTrades();
    }
  }, [userProfile?.uid]);

  // Persist trades helper
  const saveTrades = (newTrades: Trade[]) => {
    setTrades(newTrades);
    if (!userProfile?.uid) return;
    const storageKey = `${LOCAL_STORAGE_TRADES_PREFIX}${userProfile.uid}`;
    try {
      localStorage.setItem(storageKey, JSON.stringify(newTrades));
    } catch {}
  };

  // Propose a new trade to a peer
  const proposeTrade = async (
    receiverId: string,
    receiverName: string,
    offeredCardIds: string[],
    requestedCardIds: string[]
  ): Promise<Trade> => {
    if (!userProfile) throw new Error("Must be logged in to propose trades");
    if (offeredCardIds.length === 0) throw new Error("Please select at least 1 card to offer");
    if (requestedCardIds.length === 0) throw new Error("Please select at least 1 card to request");

    const newTrade: Trade = {
      tradeId: `trade-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      senderId: userProfile.uid,
      senderName: userProfile.displayName,
      receiverId,
      receiverName,
      offeredCardIds,
      requestedCardIds,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const updated = [newTrade, ...trades];
    saveTrades(updated);
    sounds.playTradeOffer();

    // Async sync to Firestore
    if (isFirebaseConfigured && db && doc && setDoc) {
      const tradeDocRef = doc(db, 'trades', newTrade.tradeId);
      setDoc(tradeDocRef, newTrade).catch(() => {});
    }

    // Interactive Classroom Peer Simulator:
    // If the recipient is a simulated classmate peer, simulate their response after a brief delay
    if (receiverId.startsWith('peer-')) {
      setTimeout(() => {
        // Classmates accept if it's a fair or beneficial offer
        setTrades(prev => {
          return prev.map(t => {
            if (t.tradeId === newTrade.tradeId && t.status === 'pending') {
              // Automatically complete simulated exchange
              exchangeCardsForTrade(t.offeredCardIds, t.requestedCardIds).then(() => {
                sounds.playTradeSuccess();
              }).catch(() => {});
              return {
                ...t,
                status: 'accepted' as const,
                updatedAt: new Date().toISOString()
              };
            }
            return t;
          });
        });
      }, 5000);
    }

    return newTrade;
  };

  // Accept an incoming trade
  const acceptTrade = async (tradeId: string): Promise<boolean> => {
    const tradeIndex = trades.findIndex(t => t.tradeId === tradeId);
    if (tradeIndex === -1) throw new Error("Trade not found");

    const trade = trades[tradeIndex];
    if (trade.status !== 'pending') throw new Error(`Trade is already ${trade.status}`);

    // If current user is receiver:
    // User gives: requestedCardIds (the cards sender requested)
    // User receives: offeredCardIds (the cards sender offered)
    const cardsToGive = trade.requestedCardIds;
    const cardsToReceive = trade.offeredCardIds;

    await exchangeCardsForTrade(cardsToGive, cardsToReceive);

    // Update trade record
    const updatedTrades = [...trades];
    updatedTrades[tradeIndex] = {
      ...trade,
      status: 'accepted',
      updatedAt: new Date().toISOString()
    };
    saveTrades(updatedTrades);
    sounds.playTradeSuccess();

    // Firestore async
    if (isFirebaseConfigured && db && doc && setDoc) {
      const tradeDocRef = doc(db, 'trades', trade.tradeId);
      setDoc(tradeDocRef, updatedTrades[tradeIndex]).catch(() => {});
    }

    return true;
  };

  // Decline an incoming trade
  const declineTrade = async (tradeId: string): Promise<boolean> => {
    const tradeIndex = trades.findIndex(t => t.tradeId === tradeId);
    if (tradeIndex === -1) throw new Error("Trade not found");

    const trade = trades[tradeIndex];
    const updatedTrades = [...trades];
    updatedTrades[tradeIndex] = {
      ...trade,
      status: 'declined',
      updatedAt: new Date().toISOString()
    };
    saveTrades(updatedTrades);

    // Firestore async
    if (isFirebaseConfigured && db && doc && setDoc) {
      const tradeDocRef = doc(db, 'trades', trade.tradeId);
      setDoc(tradeDocRef, updatedTrades[tradeIndex]).catch(() => {});
    }

    return true;
  };

  // Cancel an outgoing trade
  const cancelTrade = async (tradeId: string): Promise<boolean> => {
    const tradeIndex = trades.findIndex(t => t.tradeId === tradeId);
    if (tradeIndex === -1) throw new Error("Trade not found");

    const trade = trades[tradeIndex];
    const updatedTrades = [...trades];
    updatedTrades[tradeIndex] = {
      ...trade,
      status: 'cancelled',
      updatedAt: new Date().toISOString()
    };
    saveTrades(updatedTrades);

    // Firestore async
    if (isFirebaseConfigured && db && doc && setDoc) {
      const tradeDocRef = doc(db, 'trades', trade.tradeId);
      setDoc(tradeDocRef, updatedTrades[tradeIndex]).catch(() => {});
    }

    return true;
  };

  // Derived categorized trades
  const currentUid = userProfile?.uid || '';
  const incomingTrades = trades.filter(t => t.receiverId === currentUid && t.status === 'pending');
  const outgoingTrades = trades.filter(t => t.senderId === currentUid && t.status === 'pending');
  const tradeHistory = trades.filter(t => t.status !== 'pending');

  return (
    <TradingContext.Provider value={{
      trades,
      classmates,
      incomingTrades,
      outgoingTrades,
      tradeHistory,
      loadingTrades,
      proposeTrade,
      acceptTrade,
      declineTrade,
      cancelTrade
    }}>
      {children}
    </TradingContext.Provider>
  );
};

export const useTrading = () => {
  const context = useContext(TradingContext);
  if (!context) {
    throw new Error('useTrading must be used within a TradingProvider');
  }
  return context;
};
