import React, { useState, useEffect } from 'react';
import { useQuestions } from '../context/QuestionsContext';
import { useAuth } from '../context/AuthContext';
import { 
  CheckCircle2, 
  XCircle, 
  Award, 
  Coins, 
  Flame, 
  Volume2, 
  VolumeX, 
  RotateCcw, 
  ArrowRight, 
  Sparkles, 
  BookOpen, 
  Check, 
  AlertCircle,
  HelpCircle,
  Trophy,
  RefreshCcw,
  GraduationCap,
  ArrowLeftCircle
} from 'lucide-react';

export const QuestionsView: React.FC = () => {
  const { userProfile, isAdmin } = useAuth();
  const {
    currentQuestion,
    dailyActivity,
    gameSettings,
    soundEnabled,
    setSoundEnabled,
    hasAnsweredCurrent,
    lastResult,
    submitAnswer,
    nextQuestion,
    streak,
    isDailyLimitReached,
    practiceMode,
    setPracticeMode,
    resetDailyActivity,
    reviewQueueCount,
    isReviewMode,
    startReviewMode,
    exitReviewMode
  } = useQuestions();

  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  useEffect(() => {
    setSelectedOption(null);
  }, [currentQuestion?.questionId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (hasAnsweredCurrent) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          nextQuestion();
        }
        return;
      }

      if (['1', '2', '3', '4'].includes(e.key)) {
        const idx = parseInt(e.key, 10) - 1;
        if (currentQuestion && idx < currentQuestion.answers.length) {
          handleSelectAnswer(idx);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hasAnsweredCurrent, currentQuestion]);

  const handleSelectAnswer = (index: number) => {
    if (hasAnsweredCurrent) return;
    setSelectedOption(index);
    submitAnswer(index);
  };

  const questionsAnswered = dailyActivity?.questionsAnswered ?? 0;
  const correctAnswers = dailyActivity?.correctAnswers ?? 0;
  const coinsEarned = dailyActivity?.coinsEarned ?? 0;
  const questionLimit = gameSettings?.dailyQuestionLimit ?? 10;

  const progressPercent = Math.min(
    100, 
    Math.round((questionsAnswered / questionLimit) * 100)
  );

  const accuracyPercent = questionsAnswered > 0
    ? Math.round((correctAnswers / questionsAnswered) * 100)
    : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      
      {/* Header Bar with Daily Progress & Audio */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-300 text-[11px] font-semibold uppercase tracking-wider">
                <Sparkles className="w-3 h-3" />
                {isReviewMode ? 'Review Session' : 'Daily Trivia Quest'}
              </span>
              {practiceMode && !isReviewMode && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/25 text-indigo-300 text-[11px] font-medium">
                  Practice Mode
                </span>
              )}
              {isReviewMode && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-[11px] font-medium">
                  No coins on the line — just practice
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-black font-serif text-slate-100 mt-1">
              {isReviewMode ? 'Review Missed Questions' : 'Daily History Trivia'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              {isReviewMode
                ? 'Work back through questions you missed before — get it right and it graduates off this list for good.'
                : 'Ohio 8th Grade Social Studies (1492–1877) • Earn coins to open card packs'}
            </p>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-center">
            {!isReviewMode && (
              <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs font-mono">
                <Flame className={`w-4 h-4 ${streak > 0 ? 'text-amber-500 fill-amber-500' : 'text-slate-600'}`} />
                <span className="text-slate-400">Streak:</span>
                <span className="font-bold text-amber-400">{streak}</span>
              </div>
            )}

            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'Mute audio' : 'Enable audio'}
              className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-amber-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
            </button>
          </div>
        </div>

        {!isReviewMode && (
          <div className="mt-5 pt-4 border-t border-slate-800/80">
            <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
              <span className="text-slate-300 flex items-center gap-1.5">
                <span>Today's Questions:</span>
                <span className="font-bold text-amber-400 font-mono">
                  {questionsAnswered} / {questionLimit}
                </span>
              </span>
              <span className="text-slate-400 font-mono">
                Coins earned today: <strong className="text-amber-300">+{coinsEarned}</strong>
              </span>
            </div>

            <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-800">
              <div 
                className="bg-gradient-to-r from-amber-500 to-amber-400 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {isAdmin && !isReviewMode && (
          <div className="mt-4 flex items-center justify-end">
            <button
              type="button"
              onClick={resetDailyActivity}
              className="text-[11px] text-slate-500 hover:text-amber-400 flex items-center gap-1 transition-colors cursor-pointer"
              title="Reset today's question count (Master Admin)"
            >
              <RotateCcw className="w-3 h-3" />
              Reset Daily Count
            </button>
          </div>
        )}
      </div>

      {/* Review Mode entry/exit banner */}
      {isReviewMode ? (
        <div className="bg-gradient-to-r from-emerald-500/10 via-slate-900 to-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center shrink-0">
              <GraduationCap className="w-5 h-5" />
            </div>
            <p className="text-xs text-slate-300">
              <strong className="text-emerald-300">{reviewQueueCount}</strong> question{reviewQueueCount === 1 ? '' : 's'} left in this review session.
            </p>
          </div>
          <button
            type="button"
            onClick={exitReviewMode}
            className="w-full sm:w-auto px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <ArrowLeftCircle className="w-3.5 h-3.5" />
            <span>Back to Daily Trivia</span>
          </button>
        </div>
      ) : reviewQueueCount > 0 ? (
        <div className="bg-gradient-to-r from-indigo-500/10 via-slate-900 to-indigo-500/10 border border-indigo-500/30 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/40 flex items-center justify-center shrink-0">
              <RefreshCcw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-indigo-300">
                You have {reviewQueueCount} question{reviewQueueCount === 1 ? '' : 's'} to review
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Safe practice — no coins at stake, and getting one right removes it from this list for good.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={startReviewMode}
            className="w-full sm:w-auto px-4 py-2 bg-indigo-500 hover:bg-indigo-400 text-slate-950 font-bold rounded-xl text-xs transition-colors cursor-pointer shadow whitespace-nowrap"
          >
            Start Review Session
          </button>
        </div>
      ) : null}

      {/* Daily Cap Banner when limit reached */}
      {!isReviewMode && isDailyLimitReached && !practiceMode && (
        <div className="bg-gradient-to-r from-amber-500/15 via-slate-900 to-amber-500/15 border border-amber-500/30 rounded-2xl p-5 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center shrink-0">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-amber-300">
                Daily Goal Reached! ({gameSettings.dailyQuestionLimit} Questions Answered)
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                You've maxed out your daily question rewards today. Your daily coin cap will refresh tomorrow!
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setPracticeMode(true)}
            className="w-full sm:w-auto px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-colors cursor-pointer shadow whitespace-nowrap"
          >
            Continue in Practice Mode
          </button>
        </div>
      )}

      {/* Main Question Card */}
      {currentQuestion ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-amber-300 text-[11px] font-mono font-bold">
              {currentQuestion.standardId}
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-slate-950 border border-slate-800 text-slate-300 text-[11px]">
              {currentQuestion.topic}
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-slate-950 border border-slate-800 text-slate-400 text-[11px] hidden sm:inline-block">
              {currentQuestion.historicalEra}
            </span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ml-auto ${
              currentQuestion.difficulty === 'easy' 
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                : currentQuestion.difficulty === 'medium'
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
            }`}>
              {currentQuestion.difficulty}
            </span>
          </div>

          <h2 className="text-lg sm:text-xl font-semibold text-slate-100 leading-relaxed">
            {currentQuestion.questionText}
          </h2>

          <div className="mt-6 space-y-3">
            {currentQuestion.answers.map((answer, index) => {
              const letter = String.fromCharCode(65 + index);
              const isSelected = selectedOption === index;
              const isCorrectAnswer = index === currentQuestion.correctAnswer;
              
              let buttonStyle = "bg-slate-950 hover:bg-slate-800/80 border-slate-800 text-slate-200";
              let badgeStyle = "bg-slate-800 text-slate-300";

              if (hasAnsweredCurrent) {
                if (isCorrectAnswer) {
                  buttonStyle = "bg-emerald-950/60 border-emerald-500 text-emerald-100 ring-1 ring-emerald-500";
                  badgeStyle = "bg-emerald-500 text-slate-950 font-black";
                } else if (isSelected && !isCorrectAnswer) {
                  buttonStyle = "bg-rose-950/60 border-rose-500 text-rose-200 ring-1 ring-rose-500";
                  badgeStyle = "bg-rose-500 text-white font-black";
                } else {
                  buttonStyle = "bg-slate-950/40 border-slate-800/40 text-slate-500 opacity-60";
                  badgeStyle = "bg-slate-900 text-slate-600";
                }
              }

              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleSelectAnswer(index)}
                  disabled={hasAnsweredCurrent}
                  className={`w-full p-4 rounded-xl border text-left transition-all flex items-start gap-3.5 cursor-pointer disabled:cursor-default ${buttonStyle}`}
                >
                  <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-mono font-bold shrink-0 mt-0.5 ${badgeStyle}`}>
                    {hasAnsweredCurrent && isCorrectAnswer ? (
                      <Check className="w-4 h-4 stroke-[3]" />
                    ) : hasAnsweredCurrent && isSelected && !isCorrectAnswer ? (
                      <XCircle className="w-4 h-4" />
                    ) : (
                      letter
                    )}
                  </span>
                  <span className="flex-1 text-sm leading-snug">
                    {answer}
                  </span>
                </button>
              );
            })}
          </div>

          {hasAnsweredCurrent && lastResult && (
            <div className="mt-6 pt-5 border-t border-slate-800 space-y-4 animate-fadeIn">
              
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  {lastResult.isCorrect ? (
                    <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                      <CheckCircle2 className="w-5 h-5" />
                      <span>{lastResult.isReviewMode ? 'Nice — question graduated!' : 'Correct Answer!'}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                      <Award className="w-5 h-5" />
                      <span>Good Effort! Keep Learning.</span>
                    </div>
                  )}
                </div>

                {lastResult.isReviewMode ? (
                  lastResult.masteryDelta > 0 ? (
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-bold">
                      <span>+{lastResult.masteryDelta} Mastery</span>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400">Still in your review queue — try again next round</span>
                  )
                ) : lastResult.coinsAwarded > 0 ? (
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-mono font-bold">
                    <Coins className="w-3.5 h-3.5 text-amber-400" />
                    <span>+{lastResult.coinsAwarded} Coins Earned</span>
                  </div>
                ) : (
                  <span className="text-xs text-slate-400">No coins this round</span>
                )}
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/90 text-xs sm:text-sm text-slate-300 leading-relaxed">
                <div className="flex items-center gap-1.5 text-amber-400 font-bold text-xs mb-1.5">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Historical Context & Standard Explanation</span>
                </div>
                <p>{lastResult.explanation}</p>
                {currentQuestion.standardDescription && (
                  <p className="mt-2 text-[11px] text-slate-500 border-t border-slate-900 pt-2 font-mono">
                    Standard: {currentQuestion.standardDescription}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end pt-2">
                <button
                  type="button"
                  id="next-question-button"
                  onClick={nextQuestion}
                  className="w-full sm:w-auto px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-sm transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Next Question</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

            </div>
          )}

        </div>
      ) : isReviewMode ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-200">You're all caught up!</h3>
          <p className="text-xs text-slate-400 mt-1">
            Nothing left in your review queue right now — great work.
          </p>
          <button
            type="button"
            onClick={exitReviewMode}
            className="mt-4 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl"
          >
            Back to Daily Trivia
          </button>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center">
          <HelpCircle className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-200">No trivia questions are active right now</h3>
          <p className="text-xs text-slate-400 mt-1">
            Ask your teacher to activate questions in the Admin Console.
          </p>
        </div>
      )}

      {!isReviewMode && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">Daily Accuracy</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-2xl font-black text-slate-100 font-mono mt-1">
              {accuracyPercent}%
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {correctAnswers} of {questionsAnswered} correct today
            </p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">Coin Rewards</span>
              <Coins className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-2xl font-black text-amber-400 font-mono mt-1">
              +{gameSettings?.correctCoinReward ?? 10} / +{gameSettings?.incorrectCoinReward ?? 3}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              +10 for correct, +3 effort (never lost)
            </p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">Daily Cap Rule</span>
              <Trophy className="w-4 h-4 text-indigo-400" />
            </div>
            <p className="text-2xl font-black text-slate-100 font-mono mt-1">
              {Math.max(0, questionLimit - questionsAnswered)} Left
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {questionLimit} questions max rewarded daily
            </p>
          </div>
        </div>
      )}

    </div>
  );
};