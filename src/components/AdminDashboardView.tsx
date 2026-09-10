import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useQuestions } from '../context/QuestionsContext';
import { useCards } from '../context/CardsContext';
import { INITIAL_UNITS, INITIAL_STANDARDS } from '../data/initialCurriculum';
import { NavigationTab, Question } from '../types';
import { 
  ShieldCheck, 
  Settings, 
  HelpCircle, 
  BookOpen, 
  Sliders, 
  Plus, 
  Check, 
  Trash2, 
  ToggleLeft, 
  ToggleRight, 
  Filter, 
  Package, 
  Eye, 
  GraduationCap, 
  Users, 
  Award,
  Sparkles,
  Layers,
  Search
} from 'lucide-react';

interface AdminDashboardViewProps {
  onNavigate?: (tab: NavigationTab) => void;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({ onNavigate }) => {
  const { userProfile, isAdmin, setStudentViewMode } = useAuth();
  const { 
    questions, 
    gameSettings, 
    updateGameSettings, 
    addQuestion, 
    toggleQuestionActive, 
    deleteQuestion 
  } = useQuestions();

  const {
    cards,
    toggleCardActive
  } = useCards();

  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'questions' | 'cards' | 'economy' | 'units' | 'standards'>('overview');

  // Economy state
  const [dailyLimit, setDailyLimit] = useState(gameSettings.dailyQuestionLimit);
  const [correctReward, setCorrectReward] = useState(gameSettings.correctCoinReward);
  const [incorrectReward, setIncorrectReward] = useState(gameSettings.incorrectCoinReward);
  const [packCost, setPackCost] = useState(gameSettings.standardPackCost);
  const [savedNotice, setSavedNotice] = useState(false);

  // Question bank filters & modal
  const [filterUnit, setFilterUnit] = useState<string>('all');
  const [questionSearch, setQuestionSearch] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newQText, setNewQText] = useState('');
  const [newAnswers, setNewAnswers] = useState(['', '', '', '']);
  const [newCorrectIdx, setNewCorrectIdx] = useState(0);
  const [newExplanation, setNewExplanation] = useState('');
  const [newUnitId, setNewUnitId] = useState('unit-1');
  const [newStandardId, setNewStandardId] = useState('OH-SS8-2026.1');
  const [newDifficulty, setNewDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [newTopic, setNewTopic] = useState('');

  // Card catalog filters
  const [filterCardUnit, setFilterCardUnit] = useState<string>('all');
  const [filterCardRarity, setFilterCardRarity] = useState<string>('all');
  const [cardSearch, setCardSearch] = useState<string>('');

  const handleSaveEconomy = (e: React.FormEvent) => {
    e.preventDefault();
    updateGameSettings({
      dailyQuestionLimit: Number(dailyLimit),
      correctCoinReward: Number(correctReward),
      incorrectCoinReward: Number(incorrectReward),
      standardPackCost: Number(packCost)
    });
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  const handleCreateQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQText.trim() || newAnswers.some(a => !a.trim())) return;

    const unitObj = INITIAL_UNITS.find(u => u.unitId === newUnitId);
    const standardObj = INITIAL_STANDARDS.find(s => s.standardId === newStandardId);

    addQuestion({
      questionText: newQText.trim(),
      answers: newAnswers.map(a => a.trim()),
      correctAnswer: newCorrectIdx,
      explanation: newExplanation.trim() || 'Curriculum concept verified by Ohio 8th Grade Social Studies administrator.',
      unitId: newUnitId,
      unitName: unitObj?.unitName || 'Custom Unit',
      standardId: newStandardId,
      standardDescription: standardObj?.standardDescription,
      topic: newTopic.trim() || 'Ohio History Concepts',
      historicalEra: 'Early America (1492–1877)',
      difficulty: newDifficulty,
      active: true
    });

    setNewQText('');
    setNewAnswers(['', '', '', '']);
    setNewExplanation('');
    setNewTopic('');
    setShowAddModal(false);
  };

  const filteredQuestions = questions.filter(q => {
    if (filterUnit !== 'all' && q.unitId !== filterUnit) return false;
    if (questionSearch.trim()) {
      const qText = q.questionText.toLowerCase();
      const sTopic = (q.topic || '').toLowerCase();
      const term = questionSearch.toLowerCase();
      if (!qText.includes(term) && !sTopic.includes(term)) return false;
    }
    return true;
  });

  const filteredCards = cards.filter(c => {
    if (filterCardUnit !== 'all' && c.unitId !== filterCardUnit) return false;
    if (filterCardRarity !== 'all' && c.rarity !== filterCardRarity) return false;
    if (cardSearch.trim()) {
      const name = c.name.toLowerCase();
      const desc = c.description.toLowerCase();
      const term = cardSearch.toLowerCase();
      if (!name.includes(term) && !desc.includes(term)) return false;
    }
    return true;
  });

  if (!isAdmin) {
    return (
      <div className="max-w-xl mx-auto p-8 bg-slate-900 border border-slate-800 rounded-2xl text-center space-y-4 my-12 shadow-xl">
        <ShieldCheck className="w-12 h-12 text-amber-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-100 font-serif">Program Admin Console</h2>
        <p className="text-xs text-slate-400">
          This administration console is reserved for the History Card Quest program director. Sign in with your program administrator account (<span className="font-mono text-amber-300">jaf2jc@bearworks.jackson.sparcc.org</span>) for system access.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16">
      
      {/* Admin Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center justify-center shrink-0">
              <Settings className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black font-serif text-slate-100 truncate">
                  Program Administration Console
                </h1>
                <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">
                  Program Director & Administrator
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Centralized management for Ohio 8th Grade curriculum standards, question bank, coin economy, and card catalog.
              </p>
            </div>
          </div>

          {/* Action Links: Open Teacher Dashboard or Launch Student View */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {onNavigate && (
              <button
                id="admin-to-teacher-portal-button"
                type="button"
                onClick={() => onNavigate('teacher')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500/15 border border-amber-500/40 text-amber-300 hover:bg-amber-500/25 transition-all cursor-pointer shadow-sm"
                title="Switch to classroom teacher tools & roster"
              >
                <GraduationCap className="w-4 h-4 text-amber-400" />
                <span>Teacher Dashboard</span>
              </button>
            )}

            <button
              id="admin-launch-student-view-button"
              type="button"
              onClick={() => {
                setStudentViewMode(true);
                if (onNavigate) onNavigate('dashboard');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-950/80 border border-emerald-700 text-emerald-300 hover:bg-emerald-900/90 transition-all cursor-pointer shadow-sm"
              title="Preview game exactly as a student sees it"
            >
              <Eye className="w-4 h-4 text-emerald-400" />
              <span>Student View</span>
            </button>

            <div className="flex items-center gap-2 text-xs font-mono text-slate-400 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="truncate max-w-[160px]">{userProfile?.email || 'Admin'}</span>
            </div>
          </div>
        </div>

        {/* Sub-navigation tabs */}
        <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t border-slate-800 text-xs font-medium">
          <button
            id="admin-subtab-overview"
            type="button"
            onClick={() => setActiveSubTab('overview')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeSubTab === 'overview' ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            System Overview
          </button>
          <button
            id="admin-subtab-questions"
            type="button"
            onClick={() => setActiveSubTab('questions')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'questions' ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Question Bank ({questions.length})</span>
          </button>
          <button
            id="admin-subtab-cards"
            type="button"
            onClick={() => setActiveSubTab('cards')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'cards' ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Card Catalog & Rarity ({cards.length})</span>
          </button>
          <button
            id="admin-subtab-economy"
            type="button"
            onClick={() => setActiveSubTab('economy')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'economy' ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Classroom Economy & Daily Caps</span>
          </button>
          <button
            id="admin-subtab-units"
            type="button"
            onClick={() => setActiveSubTab('units')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'units' ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Curriculum Scope ({INITIAL_UNITS.length} Units)</span>
          </button>
          <button
            id="admin-subtab-standards"
            type="button"
            onClick={() => setActiveSubTab('standards')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'standards' ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Ohio 2026 Standards Matrix</span>
          </button>
        </div>
      </div>

      {/* 1. Overview Tab */}
      {activeSubTab === 'overview' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow">
              <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                <span>Active Question Bank</span>
                <HelpCircle className="w-4 h-4 text-amber-400" />
              </div>
              <p className="text-3xl font-black text-slate-100 font-mono">
                {questions.filter(q => q.active).length}
              </p>
              <p className="text-xs text-slate-400 mt-1">Ready across all 8 curriculum units</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow">
              <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                <span>Catalog Cards</span>
                <Package className="w-4 h-4 text-amber-400" />
              </div>
              <p className="text-3xl font-black text-slate-100 font-mono">
                {cards.filter(c => c.active).length}
              </p>
              <p className="text-xs text-slate-400 mt-1">Available in booster packs</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow">
              <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                <span>Ohio 2026 Standards</span>
                <Award className="w-4 h-4 text-amber-400" />
              </div>
              <p className="text-3xl font-black text-slate-100 font-mono">
                {INITIAL_STANDARDS.length}
              </p>
              <p className="text-xs text-slate-400 mt-1">100% Social Studies coverage</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow">
              <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                <span>Student Privacy Standard</span>
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-xl font-bold text-emerald-400 font-mono">FERPA Compliant</p>
              <p className="text-xs text-slate-400 mt-1">Zero public PII exposed</p>
            </div>
          </div>

          {/* Quick Admin Navigation Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div 
              onClick={() => setActiveSubTab('questions')}
              className="bg-slate-900 border border-slate-800 hover:border-amber-500/50 rounded-2xl p-5 cursor-pointer transition-all hover:-translate-y-0.5 shadow group"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-3 group-hover:bg-amber-500 group-hover:text-slate-950 transition-colors">
                <HelpCircle className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-100 text-sm group-hover:text-amber-400 transition-colors">
                Question Bank Manager
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Add, activate, or deactivate trivia questions mapped to Ohio curriculum units and historical explanations.
              </p>
            </div>

            <div 
              onClick={() => setActiveSubTab('cards')}
              className="bg-slate-900 border border-slate-800 hover:border-amber-500/50 rounded-2xl p-5 cursor-pointer transition-all hover:-translate-y-0.5 shadow group"
            >
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-3 group-hover:bg-indigo-500 group-hover:text-slate-950 transition-colors">
                <Package className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-100 text-sm group-hover:text-indigo-400 transition-colors">
                Card Catalog & Rarity Tuning
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Review historical figures, founding documents, artifacts, and tune drop percentages across rarity tiers.
              </p>
            </div>

            <div 
              onClick={() => setActiveSubTab('economy')}
              className="bg-slate-900 border border-slate-800 hover:border-amber-500/50 rounded-2xl p-5 cursor-pointer transition-all hover:-translate-y-0.5 shadow group"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-3 group-hover:bg-emerald-500 group-hover:text-slate-950 transition-colors">
                <Sliders className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-100 text-sm group-hover:text-emerald-400 transition-colors">
                Classroom Economy Tuning
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Set daily student question caps, correct answer coin incentives, and pack purchase costs.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 2. Question Bank Tab */}
      {activeSubTab === 'questions' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 flex-1">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="text-xs text-slate-300 font-medium">Unit:</span>
                <select
                  value={filterUnit}
                  onChange={(e) => setFilterUnit(e.target.value)}
                  className="bg-slate-950 border border-slate-700 text-xs text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-amber-400"
                >
                  <option value="all">All Units ({questions.length})</option>
                  {INITIAL_UNITS.map(u => (
                    <option key={u.unitId} value={u.unitId}>
                      {u.unitName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 flex-1 max-w-xs">
                <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <input
                  type="text"
                  value={questionSearch}
                  onChange={(e) => setQuestionSearch(e.target.value)}
                  placeholder="Search questions or topics..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <button
              id="admin-add-question-button"
              type="button"
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Add Custom Question</span>
            </button>
          </div>

          {/* Questions List */}
          <div className="space-y-3">
            {filteredQuestions.map((q, idx) => (
              <div 
                key={q.questionId}
                className={`bg-slate-900 border rounded-xl p-4 sm:p-5 transition-all ${
                  q.active ? 'border-slate-800' : 'border-slate-800/40 opacity-60 bg-slate-950/40'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-mono font-bold text-amber-400 px-2 py-0.5 rounded bg-slate-950 border border-slate-800">
                        {q.standardId}
                      </span>
                      <span className="text-[11px] text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                        {q.topic}
                      </span>
                      <span className="text-[10px] uppercase font-semibold text-slate-400">
                        {q.difficulty}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        q.active ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {q.active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-slate-100">
                      {idx + 1}. {q.questionText}
                    </p>
                    
                    {/* Multiple Choice Answers */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-2">
                      {q.answers.map((ans, aIdx) => (
                        <div 
                          key={aIdx}
                          className={`text-xs p-2 rounded-lg border ${
                            aIdx === q.correctAnswer 
                              ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200 font-medium'
                              : 'bg-slate-950/60 border-slate-800/60 text-slate-400'
                          }`}
                        >
                          <span className="font-mono mr-1.5 text-slate-500">
                            {String.fromCharCode(65 + aIdx)}.
                          </span>
                          {ans}
                          {aIdx === q.correctAnswer && (
                            <span className="ml-2 text-[10px] text-emerald-400 font-bold uppercase">(Correct)</span>
                          )}
                        </div>
                      ))}
                    </div>

                    <p className="text-[11px] text-slate-400 pt-2 italic">
                      💡 {q.explanation}
                    </p>
                  </div>

                  {/* Toggle / Delete Actions */}
                  <div className="flex sm:flex-col items-center gap-2 shrink-0 self-end sm:self-start">
                    <button
                      type="button"
                      onClick={() => toggleQuestionActive(q.questionId)}
                      title={q.active ? 'Deactivate question' : 'Activate question'}
                      className="p-1.5 text-xs text-slate-400 hover:text-amber-400 cursor-pointer"
                    >
                      {q.active ? <ToggleRight className="w-6 h-6 text-emerald-400" /> : <ToggleLeft className="w-6 h-6 text-slate-600" />}
                    </button>
                    {q.questionId.startsWith('q-custom-') && (
                      <button
                        type="button"
                        onClick={() => deleteQuestion(q.questionId)}
                        title="Delete custom question"
                        className="p-1.5 text-xs text-rose-400 hover:text-rose-300 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Card Catalog Tab */}
      {activeSubTab === 'cards' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Rarity & Distribution Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow">
              <span className="text-[10px] uppercase font-mono text-slate-400 block">Total Cards</span>
              <span className="text-xl font-bold font-mono text-slate-100 mt-0.5 block">{cards.length}</span>
              <span className="text-[10px] text-emerald-400">{cards.filter(c => c.active).length} Active</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow">
              <span className="text-[10px] uppercase font-mono text-slate-400 block">Common (65%)</span>
              <span className="text-xl font-bold font-mono text-slate-300 mt-0.5 block">
                {cards.filter(c => c.rarity === 'Common').length}
              </span>
              <span className="text-[10px] text-slate-500">Base tier</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow">
              <span className="text-[10px] uppercase font-mono text-emerald-400 block">Uncommon (22%)</span>
              <span className="text-xl font-bold font-mono text-emerald-300 mt-0.5 block">
                {cards.filter(c => c.rarity === 'Uncommon').length}
              </span>
              <span className="text-[10px] text-slate-500">Core concepts</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow">
              <span className="text-[10px] uppercase font-mono text-blue-400 block">Rare (9%)</span>
              <span className="text-xl font-bold font-mono text-blue-300 mt-0.5 block">
                {cards.filter(c => c.rarity === 'Rare').length}
              </span>
              <span className="text-[10px] text-slate-500">Key artifacts</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow">
              <span className="text-[10px] uppercase font-mono text-amber-400 block">Legendary (3.5%)</span>
              <span className="text-xl font-bold font-mono text-amber-300 mt-0.5 block">
                {cards.filter(c => c.rarity === 'Legendary').length}
              </span>
              <span className="text-[10px] text-slate-500">Major leaders</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow">
              <span className="text-[10px] uppercase font-mono text-purple-400 block">Mythical (0.5%)</span>
              <span className="text-xl font-bold font-mono text-purple-300 mt-0.5 block">
                {cards.filter(c => c.rarity === 'Mythical').length}
              </span>
              <span className="text-[10px] text-slate-500">Foundational</span>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow">
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto flex-1">
              <div className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-xs text-slate-400 font-mono">Unit:</span>
                <select
                  value={filterCardUnit}
                  onChange={(e) => setFilterCardUnit(e.target.value)}
                  className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-1.5 focus:border-amber-400 focus:outline-none"
                >
                  <option value="all">All Units ({cards.length})</option>
                  {INITIAL_UNITS.map(u => (
                    <option key={u.unitId} value={u.unitId}>
                      {u.order}. {u.unitName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-mono">Rarity:</span>
                <select
                  value={filterCardRarity}
                  onChange={(e) => setFilterCardRarity(e.target.value)}
                  className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-1.5 focus:border-amber-400 focus:outline-none"
                >
                  <option value="all">All Rarities</option>
                  <option value="Common">Common</option>
                  <option value="Uncommon">Uncommon</option>
                  <option value="Rare">Rare</option>
                  <option value="Legendary">Legendary</option>
                  <option value="Mythical">Mythical</option>
                </select>
              </div>

              <div className="flex items-center gap-2 flex-1 max-w-xs">
                <Search className="w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  value={cardSearch}
                  onChange={(e) => setCardSearch(e.target.value)}
                  placeholder="Search cards..."
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-1.5 focus:border-amber-400 focus:outline-none"
                />
              </div>
            </div>

            <p className="text-xs text-slate-400 font-mono shrink-0">
              Showing {filteredCards.length} cards
            </p>
          </div>

          {/* Cards List */}
          <div className="space-y-3">
            {filteredCards.map(card => (
              <div
                key={card.cardId}
                className={`bg-slate-900 border rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors ${
                  card.active ? 'border-slate-800 hover:border-slate-700' : 'border-rose-900/40 opacity-60'
                }`}
              >
                <div className="flex items-start gap-3.5 min-w-0 flex-1">
                  <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-2xl shrink-0">
                    {card.symbol || '📜'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        card.rarity === 'Mythical' ? 'bg-purple-500/20 text-purple-300 border-purple-400/40' :
                        card.rarity === 'Legendary' ? 'bg-amber-500/20 text-amber-300 border-amber-400/40' :
                        card.rarity === 'Rare' ? 'bg-blue-500/20 text-blue-300 border-blue-400/40' :
                        card.rarity === 'Uncommon' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40' :
                        'bg-slate-800 text-slate-300 border-slate-700'
                      }`}>
                        {card.rarity}
                      </span>
                      <span className="text-[10px] font-mono text-amber-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                        {card.standardId}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {card.packTheme}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-100 font-serif">
                      {card.name}
                    </h4>
                    <p className="text-xs text-slate-300 mt-1 line-clamp-2">
                      {card.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={() => toggleCardActive(card.cardId)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer border ${
                      card.active
                        ? 'bg-emerald-950 border-emerald-800 text-emerald-300 hover:bg-emerald-900'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {card.active ? <ToggleRight className="w-4 h-4 text-emerald-400" /> : <ToggleLeft className="w-4 h-4 text-slate-500" />}
                    <span>{card.active ? 'Active in Packs' : 'Vaulted'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Classroom Economy Tab */}
      {activeSubTab === 'economy' && (
        <form onSubmit={handleSaveEconomy} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-100 text-base">Classroom Economy & Daily Caps</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Tune questions per day and reward values to match your classroom pacing and unit schedule.
              </p>
            </div>
            {savedNotice && (
              <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-950/80 border border-emerald-700 text-emerald-300 rounded-lg text-xs font-bold animate-pulse">
                <Check className="w-3.5 h-3.5" />
                <span>Settings Saved!</span>
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Daily Question Limit per Student
              </label>
              <input
                type="number"
                min={5}
                max={100}
                value={dailyLimit}
                onChange={(e) => setDailyLimit(Number(e.target.value))}
                className="w-full px-4 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 text-sm font-mono focus:border-amber-400 focus:outline-none"
              />
              <p className="text-[11px] text-slate-500 mt-1">Default: 25 questions per day.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Booster Pack Cost (Coins)
              </label>
              <input
                type="number"
                min={20}
                max={500}
                value={packCost}
                onChange={(e) => setPackCost(Number(e.target.value))}
                className="w-full px-4 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 text-sm font-mono focus:border-amber-400 focus:outline-none"
              />
              <p className="text-[11px] text-slate-500 mt-1">Default: 100 coins for a 5-card booster pack.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Correct Answer Reward
              </label>
              <input
                type="number"
                min={1}
                max={50}
                value={correctReward}
                onChange={(e) => setCorrectReward(Number(e.target.value))}
                className="w-full px-4 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 text-sm font-mono text-emerald-400 focus:border-amber-400 focus:outline-none"
              />
              <p className="text-[11px] text-slate-500 mt-1">Default: +10 coins.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Incorrect Answer Encouragement
              </label>
              <input
                type="number"
                min={0}
                max={25}
                value={incorrectReward}
                onChange={(e) => setIncorrectReward(Number(e.target.value))}
                className="w-full px-4 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 text-sm font-mono text-amber-400 focus:border-amber-400 focus:outline-none"
              />
              <p className="text-[11px] text-slate-500 mt-1">Default: +3 coins (coins are never deducted).</p>
            </div>
          </div>

          <button
            id="admin-save-economy-button"
            type="submit"
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Apply Economy Settings</span>
          </button>
        </form>
      )}

      {/* 5. Curriculum Scope Tab */}
      {activeSubTab === 'units' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-100 text-base">Ohio 8th Grade Social Studies Scope (8 Units)</h3>
            <span className="text-xs text-slate-400 font-mono">1492 to 1877 Reconstruction</span>
          </div>
          <div className="space-y-2.5">
            {INITIAL_UNITS.map((unit) => (
              <div key={unit.unitId} className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex items-start gap-3">
                <span className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-300 font-mono text-xs font-bold flex items-center justify-center shrink-0">
                  {unit.order}
                </span>
                <div className="flex-1">
                  <h4 className="text-xs font-bold text-slate-200">{unit.unitName}</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{unit.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. Ohio 2026 Standards Tab */}
      {activeSubTab === 'standards' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-100 text-base">Ohio 8th Grade Social Studies Standards (2026 Transition)</h3>
            <span className="text-xs text-slate-400 font-mono">Curriculum Alignment Matrix</span>
          </div>
          <div className="space-y-2.5">
            {INITIAL_STANDARDS.map((std) => (
              <div key={std.standardId} className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-amber-400">{std.standardId}</span>
                  <span className="text-[11px] text-slate-400">{std.topic}</span>
                </div>
                <p className="text-xs text-slate-300">{std.standardDescription}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Custom Question Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-slate-100 text-base">Add New Ohio History Question</h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white text-xs cursor-pointer"
              >
                ✕ Cancel
              </button>
            </div>

            <form onSubmit={handleCreateQuestion} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Question Prompt
                </label>
                <textarea
                  required
                  rows={3}
                  value={newQText}
                  onChange={(e) => setNewQText(e.target.value)}
                  placeholder="e.g. Which Ohio river city served as a major station on the Underground Railroad?"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-slate-100 focus:border-amber-400 focus:outline-none"
                />
              </div>

              {/* 4 Answers */}
              <div className="space-y-2">
                <label className="block text-xs font-medium text-slate-300">
                  Multiple Choice Answers (Select the Correct Choice)
                </label>
                {newAnswers.map((ans, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="correctAnswerChoiceAdmin"
                      checked={newCorrectIdx === idx}
                      onChange={() => setNewCorrectIdx(idx)}
                      className="text-amber-500 focus:ring-amber-400 h-4 w-4 cursor-pointer"
                    />
                    <span className="text-xs font-mono text-slate-400 w-4">
                      {String.fromCharCode(65 + idx)}.
                    </span>
                    <input
                      type="text"
                      required
                      value={ans}
                      onChange={(e) => {
                        const copy = [...newAnswers];
                        copy[idx] = e.target.value;
                        setNewAnswers(copy);
                      }}
                      placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                      className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:border-amber-400 focus:outline-none"
                    />
                  </div>
                ))}
              </div>

              {/* Unit & Standard */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Curriculum Unit
                  </label>
                  <select
                    value={newUnitId}
                    onChange={(e) => setNewUnitId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:border-amber-400 focus:outline-none"
                  >
                    {INITIAL_UNITS.map(u => (
                      <option key={u.unitId} value={u.unitId}>
                        {u.unitName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Standard Alignment
                  </label>
                  <select
                    value={newStandardId}
                    onChange={(e) => setNewStandardId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:border-amber-400 focus:outline-none"
                  >
                    {INITIAL_STANDARDS.map(s => (
                      <option key={s.standardId} value={s.standardId}>
                        {s.standardId} - {s.topic}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Topic
                  </label>
                  <input
                    type="text"
                    value={newTopic}
                    onChange={(e) => setNewTopic(e.target.value)}
                    placeholder="e.g. Underground Railroad in Ripley"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Difficulty
                  </label>
                  <select
                    value={newDifficulty}
                    onChange={(e) => setNewDifficulty(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:border-amber-400 focus:outline-none"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Historical Explanation (Shown to students after answering)
                </label>
                <textarea
                  rows={2}
                  value={newExplanation}
                  onChange={(e) => setNewExplanation(e.target.value)}
                  placeholder="Explain why the answer is correct and cite historical context..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-100 focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow cursor-pointer"
                >
                  Save to Question Bank
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
