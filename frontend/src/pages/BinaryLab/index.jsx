import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProgress } from './useProgress';
import ProgressHeader from './ProgressHeader';
import HeroSection from './HeroSection';
import { LearnBinarySwitch, PlaceValues, PatternChallenge } from './LearnSection';
import { BinaryDecimalConverter, AsciiExplorer, TextBinaryConverter } from './ConverterSection';
import { PracticeSection } from './PracticeSection';
import { QuizSection } from './QuizSection';
import BinaryBackground from './BinaryBackground';
import RobotGame from './RobotGame';
import CharacterPlaceValues from './CharacterPlaceValues';
import SameBitsDifferentMeaning from './SameBitsDifferentMeaning';

const BinaryLab = () => {
  const navigate = useNavigate();
  const { progress, addXp, recordAnswer, updateBestSpeedScore, unlockAchievement, getCurrentLevel } = useProgress();
  const [activeTab, setActiveTab] = useState('home');

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeTab]);

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <>
            <HeroSection
              onStartLearning={() => setActiveTab('learn')}
              onTakeQuiz={() => setActiveTab('quiz')}
            />
            {/* Robot Game CTA */}
            <div className="mt-8 bg-[#0e0e0e] border border-green-500/30 rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-6 cursor-pointer hover:border-green-500/60 transition-all group" onClick={() => setActiveTab('robot')}>
              <div className="text-5xl">🤖</div>
              <div className="flex-1 text-center sm:text-left">
                <h3 className="text-xl font-bold text-white mb-1">Help the Robot Talk!</h3>
                <p className="text-gray-400 text-sm">BEEP BOOP... Teach a robot the alphabet, ASCII codes and binary through 7 fun levels!</p>
              </div>
              <div className="px-6 py-3 bg-green-500/20 border border-green-500/50 text-green-400 font-bold rounded-xl group-hover:bg-green-500/30 transition-colors whitespace-nowrap">
                Play Now →
              </div>
            </div>
          </>
        );
      case 'learn':
        return (
          <div className="space-y-12 animate-fade-in">
            <div className="text-center mb-8">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Learn the Basics</h2>
              <p className="text-gray-400">Step by step guide to understanding binary.</p>
            </div>
            <LearnBinarySwitch />
            <PlaceValues />
            <PatternChallenge />
            
            <CharacterPlaceValues />
            <SameBitsDifferentMeaning />

            <div className="text-center pt-8 border-t border-gray-800">
              <button
                onClick={() => setActiveTab('tools')}
                className="px-8 py-4 bg-green-500 hover:bg-green-400 text-black font-bold rounded-xl transition-all hover:scale-105"
              >
                Next: ASCII & Converters
              </button>
            </div>
          </div>
        );
      case 'tools':
        return (
          <div className="space-y-12 animate-fade-in">
            <div className="text-center mb-8">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Interactive Tools</h2>
              <p className="text-gray-400">Play around with binary conversions and characters.</p>
            </div>
            <BinaryDecimalConverter />
            <AsciiExplorer />
            <TextBinaryConverter />

            <div className="text-center pt-8 border-t border-gray-800">
              <button
                onClick={() => setActiveTab('practice')}
                className="px-8 py-4 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-xl transition-all hover:scale-105"
              >
                Next: Practice Games
              </button>
            </div>
          </div>
        );
      case 'practice':
        return (
          <div className="animate-fade-in">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Practice Area</h2>
              <p className="text-gray-400">Sharpen your skills with these mini-games.</p>
            </div>
            <PracticeSection
              addXp={addXp}
              recordAnswer={recordAnswer}
              updateBestSpeedScore={updateBestSpeedScore}
            />

            <div className="text-center pt-12 mt-12 border-t border-gray-800">
              <button
                onClick={() => setActiveTab('quiz')}
                className="px-8 py-4 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl transition-all hover:scale-105"
              >
                Ready for the Quiz?
              </button>
            </div>
          </div>
        );
      case 'quiz':
        return (
          <div className="animate-fade-in">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">The Ultimate Test</h2>
              <p className="text-gray-400">Choose your difficulty and earn XP!</p>
            </div>
            <QuizSection
              addXp={addXp}
              recordAnswer={recordAnswer}
              unlockAchievement={unlockAchievement}
            />
          </div>
        );
      case 'robot':
        return (
          <div className="animate-fade-in">
            <RobotGame addXp={addXp} recordAnswer={recordAnswer} />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen text-gray-100 font-sans selection:bg-green-500/30 relative" style={{backgroundColor:'#000'}}>
      <BinaryBackground />
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Navigation Bar */}
        <nav className="flex flex-wrap items-center justify-between gap-4 bg-gray-900 border border-gray-800 p-2 rounded-2xl mb-8 sticky top-4 z-50 shadow-2xl backdrop-blur-lg bg-opacity-90">
          <div className="flex items-center gap-2 sm:gap-4 px-2">
            {/* Dashboard Back Button / Site Logo */}
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center space-x-2 mr-2 hover:opacity-80 transition-opacity border-r border-gray-700 pr-4 group/back"
              title="Back to Dashboard"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-md group-hover/back:scale-105 transition-transform">
                <span className="text-white font-bold text-sm">GS</span>
              </div>
              <h1 className="text-sm font-black bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 bg-clip-text text-transparent tracking-tight hidden sm:block">
                GESTION <span className="text-gray-400 font-medium">STAGIAIRE</span>
              </h1>
            </button>

            {/* BinaryLab Logo */}
            <div
              onClick={() => setActiveTab('home')}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center shadow-[0_0_10px_rgba(34,197,94,0.4)] group-hover:shadow-[0_0_15px_rgba(34,197,94,0.6)] transition-all">
                <span className="text-black font-black font-mono text-xs">01</span>
              </div>
              <span className="font-bold text-lg tracking-tight text-white hidden sm:block">BinaryLab</span>
            </div>
          </div>

          <div className="flex overflow-x-auto no-scrollbar gap-1 px-2">
            {[
              { id: 'learn', label: 'Learn' },
              { id: 'tools', label: 'Tools' },
              { id: 'practice', label: 'Practice' },
              { id: 'quiz', label: 'Quiz' },
              { id: 'robot', label: '🤖 Robot' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === tab.id
                    ? 'bg-gray-800 text-white shadow-inner'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </nav>

        <ProgressHeader progress={progress} getCurrentLevel={getCurrentLevel} />

        <main className="pb-24">
          {renderContent()}
        </main>

      </div>
    </div>
  );
};

export default BinaryLab;
