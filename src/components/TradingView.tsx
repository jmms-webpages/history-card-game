import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCards } from '../context/CardsContext';
import { useTrading, ClassmatePeer } from '../context/TradingContext';
import { Card, Trade } from '../types';
import { CardItem } from './CardItem';
import { CardDetailModal } from './CardDetailModal';
import { getAvatarById } from '../data/avatars';
import { 
  Repeat, 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ArrowRightLeft, 
  Sparkles, 
  User, 
  Layers, 
  AlertCircle,
  History,
  Send,
  Plus,
  Trash2,
  Lock,
  ArrowRight
} from 'lucide-react';

export const TradingView: React.FC = () => {
  const { userProfile } = useAuth();
  const { inventoryCards, isCardOwned, getCardCopies, getCardById } = useCards();
  const { 
    classmates, 
    incomingTrades, 
    outgoingTrades, 
    tradeHistory, 
    proposeTrade, 
    acceptTrade, 
    declineTrade, 
    cancelTrade 
  } = useTrading();

  const [activeTab, setActiveTab] = useState<'propose' | 'incoming' | 'outgoing' | 'history'>('incoming');
  
  // Proposal Form State
  const [selectedPeer, setSelectedPeer] = useState<ClassmatePeer>(classmates[0]);
  const [offeredCardIds, setOfferedCardIds] = useState<string[]>([]);
  const [requestedCardIds, setRequestedCardIds] = useState<string[]>([]);
  const [proposalSubmitting, setProposalSubmitting] = useState(false);
  const [tradeMessage, setTradeMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Filter student's inventory in trade creator
  const [inventoryFilter, setInventoryFilter] = useState<'duplicates' | 'all'>('duplicates');

  // Inspection modal
  const [inspectCard, setInspectCard] = useState<Card | null>(null);

  // Success Modal
  const [completedTrade, setCompletedTrade] = useState<Trade | null>(null);

  if (!userProfile) return null;

  // Toggle card in offer list (max 3)
  const toggleOfferCard = (cardId: string) => {
    if (offeredCardIds.includes(cardId)) {
      setOfferedCardIds(offeredCardIds.filter(id => id !== cardId));
    } else {
      if (offeredCardIds.length >= 3) {
        setTradeMessage({ type: 'error', text: 'You can offer a maximum of 3 cards per trade.' });
        return;
      }
      setOfferedCardIds([...offeredCardIds, cardId]);
      setTradeMessage(null);
    }
  };

  // Toggle card in request list (max 3)
  const toggleRequestCard = (cardId: string) => {
    if (requestedCardIds.includes(cardId)) {
      setRequestedCardIds(requestedCardIds.filter(id => id !== cardId));
    } else {
      if (requestedCardIds.length >= 3) {
        setTradeMessage({ type: 'error', text: 'You can request a maximum of 3 cards per trade.' });
        return;
      }
      setRequestedCardIds([...requestedCardIds, cardId]);
      setTradeMessage(null);
    }
  };

  // Submit Proposal
  const handleProposeTrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (offeredCardIds.length === 0) {
      setTradeMessage({ type: 'error', text: 'Please select at least 1 card from your binder to offer.' });
      return;
    }
    if (requestedCardIds.length === 0) {
      setTradeMessage({ type: 'error', text: `Please select at least 1 card to request from ${selectedPeer.displayName}.` });
      return;
    }

    setProposalSubmitting(true);
    setTradeMessage(null);

    try {
      await proposeTrade(
        selectedPeer.uid,
        selectedPeer.displayName,
        offeredCardIds,
        requestedCardIds
      );

      setTradeMessage({ 
        type: 'success', 
        text: `Trade proposal successfully sent to ${selectedPeer.displayName}! Check Outgoing Proposals to track status.` 
      });
      setOfferedCardIds([]);
      setRequestedCardIds([]);
      setActiveTab('outgoing');
    } catch (err: any) {
      setTradeMessage({ type: 'error', text: err.message || 'Failed to send trade proposal' });
    } finally {
      setProposalSubmitting(false);
    }
  };

  // Handle Accept Trade
  const handleAccept = async (trade: Trade) => {
    try {
      await acceptTrade(trade.tradeId);
      setCompletedTrade(trade);
      setTradeMessage({ type: 'success', text: `Trade with ${trade.senderName} completed successfully!` });
    } catch (err: any) {
      setTradeMessage({ type: 'error', text: err.message || 'Trade could not be executed.' });
    }
  };

  // Student available cards to offer
  const seenCardIds = new Set<string>();
  const uniqueOwnedCards: (typeof inventoryCards[0])[] = [];
  for (const item of inventoryCards) {
    if (!seenCardIds.has(item.cardId)) {
      seenCardIds.add(item.cardId);
      uniqueOwnedCards.push(item);
    }
  }

  const displayedStudentCards = inventoryFilter === 'duplicates'
    ? uniqueOwnedCards.filter(item => getCardCopies(item.cardId) > 1)
    : uniqueOwnedCards;

  return (
    <div className="space-y-8 pb-16 animate-fadeIn">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-6 w-60 h-60 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 font-mono bg-indigo-500/10 border border-indigo-500/30 px-2.5 py-0.5 rounded-full">
                Classroom Trading System
              </span>
              <span className="text-xs font-mono text-slate-400">
                Code: {userProfile.classroomCode}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black font-serif text-slate-100 flex items-center gap-3">
              <span>Student Card Trading</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
              Exchange duplicate curriculum cards safely with classmates using secure atomic transactions that guarantee fair swaps.
            </p>
          </div>

          {/* Quick Security Badges */}
          <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-800 rounded-2xl p-3 text-xs text-slate-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Anti-duplicate verification & atomic swap active</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2 mt-6 pt-6 border-t border-slate-800">
          <button
            type="button"
            onClick={() => { setActiveTab('incoming'); setTradeMessage(null); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'incoming'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <ArrowRightLeft className="w-4 h-4" />
            <span>Incoming Requests</span>
            {incomingTrades.length > 0 && (
              <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] flex items-center justify-center font-mono">
                {incomingTrades.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('propose'); setTradeMessage(null); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'propose'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Propose New Trade</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('outgoing'); setTradeMessage(null); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'outgoing'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Outgoing ({outgoingTrades.length})</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('history'); setTradeMessage(null); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'history'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Trade History ({tradeHistory.length})</span>
          </button>
        </div>
      </div>

      {/* Status Messages */}
      {tradeMessage && (
        <div className={`p-4 rounded-2xl border flex items-center gap-3 animate-fadeIn text-sm ${
          tradeMessage.type === 'success'
            ? 'bg-emerald-950/60 border-emerald-700/60 text-emerald-200'
            : 'bg-rose-950/60 border-rose-700/60 text-rose-200'
        }`}>
          {tradeMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          )}
          <span>{tradeMessage.text}</span>
        </div>
      )}

      {/* 1. INCOMING REQUESTS VIEW */}
      {activeTab === 'incoming' && (
        <div className="space-y-6 animate-fadeIn">
          {incomingTrades.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
                <ArrowRightLeft className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-slate-200 font-serif">
                No Pending Incoming Trades
              </h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                When classmates propose a trade for your duplicate cards, their offers will appear here for your review and approval.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('propose')}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Propose a Trade to a Classmate
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {incomingTrades.map(trade => {
                const offeredCards = trade.offeredCardIds.map(id => getCardById(id)).filter(Boolean) as Card[];
                const requestedCards = trade.requestedCardIds.map(id => getCardById(id)).filter(Boolean) as Card[];
                const hasAllRequested = trade.requestedCardIds.every(id => isCardOwned(id));

                return (
                  <div 
                    key={trade.tradeId}
                    className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6"
                  >
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-400 flex items-center justify-center text-lg font-bold">
                          🤝
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-slate-100 font-serif">
                              Proposal from {trade.senderName}
                            </h4>
                            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              Pending
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400 font-mono">
                            Sent {new Date(trade.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleAccept(trade)}
                          disabled={!hasAllRequested}
                          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow ${
                            hasAllRequested
                              ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                          }`}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Accept Trade</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => declineTrade(trade.tradeId)}
                          className="px-4 py-2 bg-slate-800 hover:bg-rose-950/60 hover:text-rose-300 text-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-700"
                        >
                          <XCircle className="w-4 h-4" />
                          <span>Decline</span>
                        </button>
                      </div>
                    </div>

                    {!hasAllRequested && (
                      <div className="bg-rose-950/40 border border-rose-800/60 rounded-xl p-3 text-xs text-rose-300 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>You no longer possess one or more of the cards requested in this trade offer.</span>
                      </div>
                    )}

                    {/* Card Exchange Comparison Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                      
                      {/* Left: What they offer you */}
                      <div className="space-y-3 bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-mono uppercase text-emerald-400 font-bold flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5" />
                            Cards You Will Receive ({offeredCards.length})
                          </span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {offeredCards.map(c => (
                            <CardItem
                              key={c.cardId}
                              card={c}
                              isOwned={isCardOwned(c.cardId)}
                              copiesCount={getCardCopies(c.cardId)}
                              onClick={() => setInspectCard(c)}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Right: What they want from you */}
                      <div className="space-y-3 bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-mono uppercase text-amber-400 font-bold flex items-center gap-1.5">
                            <Layers className="w-3.5 h-3.5" />
                            Cards You Will Give ({requestedCards.length})
                          </span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {requestedCards.map(c => (
                            <CardItem
                              key={c.cardId}
                              card={c}
                              isOwned={isCardOwned(c.cardId)}
                              copiesCount={getCardCopies(c.cardId)}
                              onClick={() => setInspectCard(c)}
                            />
                          ))}
                        </div>
                      </div>

                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 2. PROPOSE TRADE VIEW */}
      {activeTab === 'propose' && (
        <form onSubmit={handleProposeTrade} className="space-y-8 animate-fadeIn">
          
          {/* Step 1: Select Classmate Peer */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 font-mono font-bold text-xs flex items-center justify-center">
                  1
                </span>
                <h3 className="font-serif font-black text-slate-100 text-lg">
                  Select Classroom Trading Partner
                </h3>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                Classroom: {userProfile.classroomCode}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {classmates.map(peer => {
                const peerAvatar = getAvatarById(peer.avatar);
                const isSelected = selectedPeer.uid === peer.uid;

                return (
                  <div
                    key={peer.uid}
                    onClick={() => {
                      setSelectedPeer(peer);
                      setRequestedCardIds([]);
                    }}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-indigo-950/40 border-indigo-500 shadow-md ring-1 ring-indigo-500'
                        : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl ${peerAvatar.color} flex items-center justify-center text-xl shadow`}>
                        {peerAvatar.badge}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-bold text-slate-200 truncate">
                          {peer.displayName}
                        </h4>
                        <p className="text-[11px] text-slate-400 truncate">
                          {peer.title}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-400">
                      <span>Available for trade</span>
                      <span className="text-amber-400 font-bold">{peer.availableCardIds.length} cards</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Dual Selection Container */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Step 2: Select Cards from Your Binder */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 font-mono font-bold text-xs flex items-center justify-center">
                    2
                  </span>
                  <h3 className="font-serif font-black text-slate-100 text-lg">
                    Cards You Offer ({offeredCardIds.length}/3)
                  </h3>
                </div>

                {/* Filter toggle */}
                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                  <button
                    type="button"
                    onClick={() => setInventoryFilter('duplicates')}
                    className={`px-2.5 py-1 rounded-lg font-mono transition-colors cursor-pointer ${
                      inventoryFilter === 'duplicates'
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Duplicates Only
                  </button>
                  <button
                    type="button"
                    onClick={() => setInventoryFilter('all')}
                    className={`px-2.5 py-1 rounded-lg font-mono transition-colors cursor-pointer ${
                      inventoryFilter === 'all'
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    All Cards
                  </button>
                </div>
              </div>

              {displayedStudentCards.length === 0 ? (
                <div className="p-8 text-center bg-slate-950/50 rounded-2xl border border-dashed border-slate-800 space-y-2">
                  <Layers className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="text-xs text-slate-400">
                    {inventoryFilter === 'duplicates'
                      ? 'No duplicate cards in your binder yet. Switch to "All Cards" or open packs to find trade duplicates!'
                      : 'Your binder is currently empty. Open packs to collect historical cards.'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-96 overflow-y-auto pr-1">
                  {displayedStudentCards.map(item => {
                    const isSelected = offeredCardIds.includes(item.cardId);
                    const copies = getCardCopies(item.cardId);

                    return (
                      <div
                        key={item.cardId}
                        onClick={() => toggleOfferCard(item.cardId)}
                        className={`relative rounded-2xl transition-all cursor-pointer ${
                          isSelected ? 'ring-2 ring-amber-400 scale-[1.02]' : 'hover:opacity-90'
                        }`}
                      >
                        <CardItem
                          card={item.card}
                          isOwned={true}
                          copiesCount={copies}
                        />
                        {isSelected && (
                          <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center font-bold text-xs shadow-lg">
                            ✓
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Step 3: Select Cards from Peer */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 font-mono font-bold text-xs flex items-center justify-center">
                    3
                  </span>
                  <h3 className="font-serif font-black text-slate-100 text-lg">
                    Cards You Request ({requestedCardIds.length}/3)
                  </h3>
                </div>
                <span className="text-xs text-indigo-400 font-mono">
                  From {selectedPeer.displayName}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-96 overflow-y-auto pr-1">
                {selectedPeer.availableCardIds.map(cardId => {
                  const card = getCardById(cardId);
                  if (!card) return null;
                  const isSelected = requestedCardIds.includes(cardId);
                  const alreadyOwn = isCardOwned(cardId);

                  return (
                    <div
                      key={cardId}
                      onClick={() => toggleRequestCard(cardId)}
                      className={`relative rounded-2xl transition-all cursor-pointer ${
                        isSelected ? 'ring-2 ring-indigo-400 scale-[1.02]' : 'hover:opacity-90'
                      }`}
                    >
                      <CardItem
                        card={card}
                        isOwned={alreadyOwn}
                        copiesCount={alreadyOwn ? getCardCopies(cardId) : 0}
                      />
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-indigo-400 text-slate-950 flex items-center justify-center font-bold text-xs shadow-lg">
                          ✓
                        </div>
                      )}
                      {!alreadyOwn && (
                        <span className="absolute bottom-2 left-2 text-[9px] font-bold bg-amber-500 text-slate-950 px-1.5 py-0.5 rounded shadow">
                          Need for Binder
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Submission Action Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-bold text-slate-200">
                Ready to Send Trade Proposal?
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Offering <span className="text-amber-400 font-bold">{offeredCardIds.length} card(s)</span> in exchange for <span className="text-indigo-400 font-bold">{requestedCardIds.length} card(s)</span> from {selectedPeer.displayName}.
              </p>
            </div>

            <button
              type="submit"
              disabled={proposalSubmitting || offeredCardIds.length === 0 || requestedCardIds.length === 0}
              className={`px-6 py-3 rounded-2xl font-bold text-sm flex items-center gap-2 transition-all cursor-pointer shadow-lg ${
                offeredCardIds.length > 0 && requestedCardIds.length > 0 && !proposalSubmitting
                  ? 'bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <Send className="w-4 h-4" />
              <span>{proposalSubmitting ? 'Sending Proposal...' : 'Send Trade Proposal'}</span>
            </button>
          </div>

        </form>
      )}

      {/* 3. OUTGOING PROPOSALS VIEW */}
      {activeTab === 'outgoing' && (
        <div className="space-y-6 animate-fadeIn">
          {outgoingTrades.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
                <Clock className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-slate-200 font-serif">
                No Active Outgoing Proposals
              </h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                When you propose a trade to a classmate, you can monitor its acceptance status here or cancel it if you change your mind.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('propose')}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Create a Trade Proposal
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {outgoingTrades.map(trade => {
                const offeredCards = trade.offeredCardIds.map(id => getCardById(id)).filter(Boolean) as Card[];
                const requestedCards = trade.requestedCardIds.map(id => getCardById(id)).filter(Boolean) as Card[];

                return (
                  <div 
                    key={trade.tradeId}
                    className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6"
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-100 font-serif">
                            Offer Sent to {trade.receiverName}
                          </h4>
                          <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                            Awaiting Response
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400 font-mono">
                          Proposed {new Date(trade.createdAt).toLocaleDateString()} at {new Date(trade.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => cancelTrade(trade.tradeId)}
                        className="px-4 py-2 bg-slate-800 hover:bg-rose-950/60 hover:text-rose-300 text-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-700"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Cancel Proposal</span>
                      </button>
                    </div>

                    {/* Cards grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2 bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4">
                        <span className="text-xs font-mono uppercase text-amber-400 font-bold block">
                          You Offered ({offeredCards.length})
                        </span>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {offeredCards.map(c => (
                            <CardItem
                              key={c.cardId}
                              card={c}
                              isOwned={true}
                              copiesCount={getCardCopies(c.cardId)}
                              onClick={() => setInspectCard(c)}
                            />
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2 bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4">
                        <span className="text-xs font-mono uppercase text-indigo-400 font-bold block">
                          You Requested ({requestedCards.length})
                        </span>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {requestedCards.map(c => (
                            <CardItem
                              key={c.cardId}
                              card={c}
                              isOwned={isCardOwned(c.cardId)}
                              copiesCount={getCardCopies(c.cardId)}
                              onClick={() => setInspectCard(c)}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 4. TRADE HISTORY VIEW */}
      {activeTab === 'history' && (
        <div className="space-y-4 animate-fadeIn">
          {tradeHistory.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                <History className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-slate-200 font-serif">
                No Trade History Recorded
              </h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Completed and resolved trades will be permanently logged here as part of your Ohio 8th Grade History archive.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {tradeHistory.map(trade => {
                const isAccepted = trade.status === 'accepted';
                const isDeclined = trade.status === 'declined';
                const isCancelled = trade.status === 'cancelled';
                const offeredCards = trade.offeredCardIds.map(id => getCardById(id)).filter(Boolean) as Card[];
                const requestedCards = trade.requestedCardIds.map(id => getCardById(id)).filter(Boolean) as Card[];

                return (
                  <div
                    key={trade.tradeId}
                    className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg shrink-0 ${
                        isAccepted ? 'bg-emerald-500/20 text-emerald-400' :
                        isDeclined ? 'bg-rose-500/20 text-rose-400' :
                        'bg-slate-800 text-slate-400'
                      }`}>
                        {isAccepted ? '✓' : isDeclined ? '✕' : '⊘'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-100 font-serif">
                            {trade.senderId === userProfile.uid ? `Sent to ${trade.receiverName}` : `Received from ${trade.senderName}`}
                          </h4>
                          <span className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded border ${
                            isAccepted ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                            isDeclined ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' :
                            'bg-slate-800 text-slate-400 border-slate-700'
                          }`}>
                            {trade.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          Exchanged: {offeredCards.map(c => c.name).join(', ')} ↔ {requestedCards.map(c => c.name).join(', ')}
                        </p>
                      </div>
                    </div>

                    <span className="text-[11px] font-mono text-slate-500 shrink-0 self-end sm:self-center">
                      {new Date(trade.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Trade Success Celebration Modal */}
      {completedTrade && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-amber-500/50 rounded-3xl p-6 sm:p-8 max-w-md w-full text-center space-y-6 shadow-2xl animate-scaleUp">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto text-3xl">
              🎉
            </div>
            <div>
              <h3 className="text-2xl font-serif font-black text-slate-100">
                Trade Completed!
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Your binder has been updated with your newly acquired historical cards.
              </p>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs text-slate-300 space-y-2">
              <span className="text-[10px] uppercase font-mono text-emerald-400 block font-bold">
                New Additions to Your Collection:
              </span>
              <div className="flex flex-wrap items-center justify-center gap-2">
                {completedTrade.offeredCardIds.map(id => {
                  const card = getCardById(id);
                  return card ? (
                    <span key={id} className="bg-slate-900 px-3 py-1 rounded-xl border border-slate-700 font-medium text-amber-300">
                      {card.symbol} {card.name}
                    </span>
                  ) : null;
                })}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setCompletedTrade(null)}
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-sm transition-colors cursor-pointer"
            >
              Continue Collecting
            </button>
          </div>
        </div>
      )}

      {/* Card Inspection Modal */}
      {inspectCard && (
        <CardDetailModal
          card={inspectCard}
          isOwned={isCardOwned(inspectCard.cardId)}
          copiesCount={getCardCopies(inspectCard.cardId)}
          onClose={() => setInspectCard(null)}
          onNavigateToPacks={() => {}}
        />
      )}

    </div>
  );
};
