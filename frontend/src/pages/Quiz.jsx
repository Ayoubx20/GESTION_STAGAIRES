import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  AcademicCapIcon,
  ArrowPathIcon,
  TrophyIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
  FireIcon,
  BoltIcon,
  StarIcon
} from '@heroicons/react/24/outline';
import { questionsData } from '../data/quizData';

const Quiz = () => {
  const { t } = useLanguage();
  const [selectedLevel, setSelectedLevel] = useState(null); // null, 1, 2, or 3
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [reviewMode, setReviewMode] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [apiQuestions, setApiQuestions] = useState([]);

  // Get questions for the current level or API
  const questions = useMemo(() => {
    if (selectedLevel === 'daily') return apiQuestions;
    return selectedLevel ? questionsData[selectedLevel] : [];
  }, [selectedLevel, apiQuestions]);

  const fetchDailyQuestions = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetching from the updated v2 API
      const response = await fetch('https://quizzapi.jomoreschi.fr/api/v2/quiz?limit=10&category=science');
      const data = await response.json();
      
      if (!data.quizzes || !Array.isArray(data.quizzes)) {
        throw new Error("Invalid API response format");
      }

      const mappedQuestions = data.quizzes.map((q, idx) => {
        // Combine correct answer with bad answers
        const allOptions = [q.answer, ...q.badAnswers];
        
        // Shuffle options
        const shuffledOptions = [...allOptions];
        for (let i = shuffledOptions.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffledOptions[i], shuffledOptions[j]] = [shuffledOptions[j], shuffledOptions[i]];
        }

        return {
          id: `api-${idx}`,
          question: q.question,
          options: shuffledOptions,
          correctAnswer: shuffledOptions.indexOf(q.answer)
        };
      });

      setApiQuestions(mappedQuestions);
      setSelectedLevel('daily');
    } catch (err) {
      console.error("API Error:", err);
      setError("Impossible de charger le défi quotidien. Vérifiez votre connexion.");
    } finally {
      setLoading(false);
    }
  };

  const totalQuestions = questions.length;
  const answeredCount = Object.keys(answers).length;
  const progress = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;

  // Load saved progress
  useEffect(() => {
    const savedProgress = localStorage.getItem('quizProgress');
    if (savedProgress && !showResults) {
      try {
        const data = JSON.parse(savedProgress);
        if (data.selectedLevel) {
          if (data.selectedLevel === 'daily' && data.apiQuestions) {
            setApiQuestions(data.apiQuestions);
          }
          setSelectedLevel(data.selectedLevel);
          setAnswers(data.answers || {});
          setScore(data.score || 0);
          setCurrentQuestionIndex(data.currentQuestionIndex || 0);
        }
      } catch (e) {
        console.error("Failed to parse quiz progress", e);
      }
    }
  }, []);

  // Save progress
  useEffect(() => {
    if (selectedLevel && !showResults && answeredCount > 0) {
      localStorage.setItem('quizProgress', JSON.stringify({
        selectedLevel,
        apiQuestions: selectedLevel === 'daily' ? apiQuestions : null,
        answers,
        score,
        currentQuestionIndex
      }));
    }
  }, [selectedLevel, answers, score, currentQuestionIndex, showResults, answeredCount, apiQuestions]);

  // Warn before leave
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (selectedLevel && answeredCount > 0 && !showResults) {
        e.preventDefault();
        e.returnValue = 'You have unsaved progress. Are you sure you want to leave?';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [selectedLevel, answeredCount, showResults]);

  const currentQuestion = questions[currentQuestionIndex];

  const handleAnswerClick = useCallback((optionIndex) => {
    if (answers[currentQuestionIndex] !== undefined) return;

    const isCorrect = optionIndex === currentQuestion.correctAnswer;
    
    setAnswers(prev => ({
      ...prev,
      [currentQuestionIndex]: optionIndex
    }));
    
    if (isCorrect) {
      setScore(prev => prev + 1);
    }
  }, [currentQuestionIndex, currentQuestion, answers]);

  const nextQuestion = useCallback(() => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      setShowResults(true);
      setReviewMode(false);
      localStorage.removeItem('quizProgress');
    }
  }, [currentQuestionIndex, totalQuestions]);

  const prevQuestion = useCallback(() => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  }, [currentQuestionIndex]);

  const restartQuiz = useCallback(() => {
    setCurrentQuestionIndex(0);
    setAnswers({});
    setShowResults(false);
    setScore(0);
    setReviewMode(false);
    localStorage.removeItem('quizProgress');
  }, []);

  const changeLevel = useCallback(() => {
    setSelectedLevel(null);
    restartQuiz();
  }, [restartQuiz]);

  const showCorrection = useCallback(() => {
    setShowResults(false);
    setReviewMode(true);
    setCurrentQuestionIndex(0);
  }, []);

  const getAnswerStatus = useCallback((questionIndex, optionIndex) => {
    const isSelected = answers[questionIndex] === optionIndex;
    const isCorrect = optionIndex === questions[questionIndex]?.correctAnswer;
    const hasAnswered = answers[questionIndex] !== undefined;
    
    return { isSelected, isCorrect, hasAnswered };
  }, [answers, questions]);

  const calculatePercentage = useMemo(() => {
    return totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;
  }, [score, totalQuestions]);

  const getResultMessage = useMemo(() => {
    const percentage = calculatePercentage;
    if (percentage >= 80) return { text: "Excellent ! Vous maîtrisez le sujet.", color: "text-green-500" };
    if (percentage >= 50) return { text: "Bien joué ! Continuez ainsi.", color: "text-yellow-500" };
    return { text: "Continuez à apprendre, vous allez y arriver !", color: "text-red-500" };
  }, [calculatePercentage]);

  const circumference = 2 * Math.PI * 80;
  const strokeDashoffset = circumference * (1 - calculatePercentage / 100);

  // Level Selection Screen
  if (selectedLevel === null) {
    return (
      <div className="max-w-6xl mx-auto py-12 px-4">
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-4">
            Centre de Test
          </h1>
          <p className="text-lg text-gray-500 dark:text-gray-400">
            Choisissez un niveau fixe ou relevez le défi quotidien mis à jour automatiquement.
          </p>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-center animate-fade-in">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Daily Challenge Card */}
          <button
            onClick={fetchDailyQuestions}
            disabled={loading}
            className="flex flex-col items-center p-8 rounded-3xl border-2 border-primary-500 bg-primary-50 dark:bg-primary-900/10 transition-all duration-300 hover:scale-105 hover:shadow-2xl text-center group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-3 bg-primary-500 text-white text-xs font-bold rounded-bl-xl">NOUVEAU</div>
            <div className="p-4 rounded-2xl bg-white dark:bg-gray-800 shadow-sm mb-6 group-hover:rotate-12 transition-transform">
              <ArrowPathIcon className={`w-8 h-8 text-primary-600 ${loading ? 'animate-spin' : ''}`} />
            </div>
            <h3 className="text-2xl font-bold mb-4 text-primary-700 dark:text-primary-400">Défi Quotidien</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6 flex-grow">Questions aléatoires mises à jour automatiquement chaque jour.</p>
            <div className="w-full py-3 px-6 bg-primary-600 text-white rounded-xl font-bold shadow-md group-hover:bg-primary-700 transition-all">
              {loading ? 'Chargement...' : 'Relever le défi'}
            </div>
          </button>

          {[
            { id: 1, title: "Niveau 1", desc: "Débutant : Concepts de base et matériel.", icon: <FireIcon className="w-8 h-8" />, color: "border-green-500 text-green-600 bg-green-50 dark:bg-green-900/20" },
            { id: 3, title: "Niveau 3", desc: "Avancé : Architecture et sécurité.", icon: <StarIcon className="w-8 h-8" />, color: "border-purple-500 text-purple-600 bg-purple-50 dark:bg-purple-900/20" },
            { id: 4, title: "Niveau 4", desc: "Synthèse : Examen complet des compétences.", icon: <AcademicCapIcon className="w-8 h-8" />, color: "border-orange-500 text-orange-600 bg-orange-50 dark:bg-orange-900/20" },
            { id: 5, title: "Niveau 5", desc: "Web Dev : JavaScript, React et CSS.", icon: <BoltIcon className="w-8 h-8" />, color: "border-cyan-500 text-cyan-600 bg-cyan-50 dark:bg-cyan-900/20" },
            { id: 6, title: "Niveau 6", desc: "Expert : Organisation Judiciaire et IT.", icon: <StarIcon className="w-8 h-8" />, color: "border-rose-500 text-rose-600 bg-rose-50 dark:bg-rose-900/20" }
          ].map((level) => (
            <button
              key={level.id}
              onClick={() => setSelectedLevel(level.id)}
              className={`flex flex-col items-center p-8 rounded-3xl border-2 transition-all duration-300 hover:scale-105 hover:shadow-2xl text-center group ${level.color}`}
            >
              <div className="p-4 rounded-2xl bg-white dark:bg-gray-800 shadow-sm mb-6 group-hover:rotate-12 transition-transform">
                {level.icon}
              </div>
              <h3 className="text-2xl font-bold mb-4">{level.title}</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6 flex-grow">{level.desc}</p>
              <div className="w-full py-3 px-6 bg-white dark:bg-gray-800 rounded-xl font-bold shadow-sm group-hover:bg-opacity-80 transition-all">
                Commencer
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (showResults) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4">
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden p-8 md:p-12 text-center animate-fade-in-up">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-primary-50 dark:bg-primary-900/30 rounded-full">
              <TrophyIcon className="w-16 h-16 text-primary-600 dark:text-primary-400" />
            </div>
          </div>
          
          <h2 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white mb-2">Test Terminé !</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8 text-lg">
            {selectedLevel === 'daily' ? 'Défi Quotidien' : `Niveau ${selectedLevel}`} : {calculatePercentage}% de réussite
          </p>

          <div className="relative inline-block mb-8">
            <svg className="w-48 h-48" viewBox="0 0 192 192">
              <circle className="text-gray-200 dark:text-gray-700" strokeWidth="12" stroke="currentColor" fill="transparent" r="80" cx="96" cy="96" />
              <circle
                className="text-primary-600 transition-all duration-1000 ease-out"
                strokeWidth="12" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
                strokeLinecap="round" stroke="currentColor" fill="transparent" r="80" cx="96" cy="96"
                style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-black text-gray-900 dark:text-white">{calculatePercentage}%</span>
              <span className="text-sm font-medium text-gray-500 uppercase tracking-widest">{score}/{totalQuestions}</span>
            </div>
          </div>

          <p className={`text-xl font-bold mb-8 ${getResultMessage.color}`}>{getResultMessage.text}</p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={restartQuiz} className="px-8 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-primary-500/25 flex items-center justify-center gap-2">
              <ArrowPathIcon className="w-5 h-5" /> Recommencer
            </button>
            <button onClick={showCorrection} className="px-8 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-xl font-bold transition-all flex items-center justify-center gap-2">
              Voir la Correction
            </button>
            <button onClick={changeLevel} className="px-8 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-xl font-bold transition-all">
              Changer de Niveau
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button onClick={changeLevel} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors mr-2">
              <ChevronLeftIcon className="w-6 h-6 text-gray-500" />
            </button>
            <div className="p-2 bg-primary-100 dark:bg-primary-900/40 rounded-lg">
              <AcademicCapIcon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {reviewMode ? 'Correction' : (selectedLevel === 'daily' ? 'Défi Quotidien' : `Niveau ${selectedLevel}`)}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Question {currentQuestionIndex + 1} sur {totalQuestions}</p>
            </div>
          </div>
          <div className="hidden md:block">
            <div className="px-4 py-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-2">
              <TrophyIcon className="w-5 h-5 text-yellow-500" />
              <span className="font-bold text-gray-700 dark:text-gray-200">Score: {score}</span>
            </div>
          </div>
        </div>

        <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-primary-600 to-indigo-600 transition-all duration-500 ease-out" style={{ width: `${progress}%`, transform: 'translateZ(0)' }} />
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-gray-700 p-8 md:p-10 animate-fade-in">
        <div className="mb-8">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white leading-tight">
            {currentQuestion?.question}
          </h2>
          {reviewMode && answers[currentQuestionIndex] !== undefined && (
            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-2xl border border-gray-100 dark:border-gray-600">
              <p className="text-sm mb-1"><span className="font-semibold opacity-70">Votre réponse:</span> <span className={answers[currentQuestionIndex] === currentQuestion.correctAnswer ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>{currentQuestion.options[answers[currentQuestionIndex]]}</span></p>
              {answers[currentQuestionIndex] !== currentQuestion.correctAnswer && (
                <p className="text-sm"><span className="font-semibold opacity-70">Réponse correcte:</span> <span className="text-green-600 font-bold">{currentQuestion.options[currentQuestion.correctAnswer]}</span></p>
              )}
            </div>
          )}
        </div>

        <div className="grid gap-4">
          {currentQuestion?.options.map((option, index) => {
            const { isSelected, isCorrect, hasAnswered } = getAnswerStatus(currentQuestionIndex, index);
            let statusClass = "border-gray-100 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-600";
            let icon = null;

            if (hasAnswered || reviewMode) {
              if (isCorrect) {
                statusClass = "border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400";
                icon = <CheckCircleIcon className="w-6 h-6 text-green-500" />;
              } else if (isSelected) {
                statusClass = "border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400";
                icon = <XCircleIcon className="w-6 h-6 text-red-500" />;
              } else if (reviewMode) {
                statusClass = "border-gray-100 dark:border-gray-700 opacity-50";
              }
            } else if (isSelected) {
              statusClass = "border-primary-500 bg-primary-50 dark:bg-primary-900/20 ring-2 ring-primary-500";
            }

            return (
              <button key={index} onClick={() => handleAnswerClick(index)} disabled={hasAnswered && !reviewMode} className={`group flex items-center justify-between p-5 text-left rounded-2xl border-2 transition-all duration-200 ${statusClass} ${!hasAnswered && !reviewMode ? 'hover:shadow-md' : ''}`}>
                <div className="flex items-center gap-4">
                  <span className={`flex items-center justify-center w-10 h-10 rounded-xl font-bold transition-colors ${hasAnswered || reviewMode ? (isCorrect ? 'bg-green-500 text-white' : (isSelected ? 'bg-red-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-400')) : (isSelected ? 'bg-primary-500 text-white' : 'bg-gray-50 dark:bg-gray-700/50 text-gray-500 group-hover:bg-primary-100 group-hover:text-primary-600')}`}>
                    {String.fromCharCode(65 + index)}
                  </span>
                  <span className="font-medium text-lg">{option}</span>
                </div>
                {icon}
              </button>
            );
          })}
        </div>

        <div className="mt-10 flex items-center justify-between">
          <button onClick={prevQuestion} disabled={currentQuestionIndex === 0} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all ${currentQuestionIndex === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
            <ChevronLeftIcon className="w-5 h-5" /> Précédent
          </button>
          <button onClick={nextQuestion} disabled={!reviewMode && answers[currentQuestionIndex] === undefined} className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold transition-all ${reviewMode || answers[currentQuestionIndex] !== undefined ? 'bg-primary-600 hover:bg-primary-700 text-white shadow-lg shadow-primary-500/25' : 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed'}`}>
            {currentQuestionIndex === totalQuestions - 1 ? 'Terminer' : 'Suivant'} <ChevronRightIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="mt-8 flex justify-center gap-2 overflow-x-auto py-4 px-4 scrollbar-hide">
        {questions.map((_, index) => {
          const dotHasAnswered = answers[index] !== undefined;
          const dotIsCorrect = answers[index] === questions[index]?.correctAnswer;
          const isCurrent = index === currentQuestionIndex;
          let dotClass = isCurrent ? "bg-primary-500 ring-4 ring-primary-500/20 scale-125" : (dotHasAnswered ? (dotIsCorrect ? "bg-green-500" : "bg-red-500") : "bg-gray-200 dark:bg-gray-700");
          return <button key={index} onClick={() => setCurrentQuestionIndex(index)} className={`w-3 h-3 rounded-full flex-shrink-0 transition-all duration-300 ${dotClass}`} />;
        })}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
        .animate-fade-in-up { animation: fadeInUp 0.6s ease-out forwards; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
};

export default Quiz;