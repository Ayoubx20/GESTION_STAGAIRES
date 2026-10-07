import React, { useState, useEffect } from 'react';
import { ArrowRight, Play } from 'lucide-react';

const HeroSection = ({ onStartLearning, onTakeQuiz }) => {
  const binaryString = "01001000 01100101 01101100 01101100 01101111"; // Hello
  const [displayedBinary, setDisplayedBinary] = useState(binaryString.split(''));

  useEffect(() => {
    const interval = setInterval(() => {
      setDisplayedBinary(prev => {
        const next = [...prev];
        // Randomly flip a bit for animation, then change it back quickly (or just let it cycle)
        const idx = Math.floor(Math.random() * next.length);
        if (next[idx] === '0' || next[idx] === '1') {
          next[idx] = next[idx] === '0' ? '1' : '0';
          setTimeout(() => {
            setDisplayedBinary(binaryString.split(''));
          }, 150);
        }
        return next;
      });
    }, 2000);
    return () => clearInterval(interval);
  }, [binaryString]);

  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-4">
      <div className="inline-block mb-6 px-4 py-1.5 rounded-full border border-green-500/30 bg-green-500/10 text-green-400 text-sm font-semibold tracking-wider uppercase">
        Interactive Experience
      </div>
      
      <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6 tracking-tight">
        Master Binary <br className="hidden md:block"/> 
        <span className="bg-gradient-to-r from-green-400 to-cyan-400 bg-clip-text text-transparent">
          Without the Headache
        </span>
      </h1>
      
      <p className="text-gray-400 text-lg md:text-xl max-w-2xl mb-12 leading-relaxed">
        Learn 0s and 1s, discover how computers represent numbers and letters, 
        and challenge yourself with interactive quizzes.
      </p>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 md:p-8 mb-12 shadow-2xl relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-cyan-500/5 group-hover:opacity-100 transition-opacity opacity-50"></div>
        <div className="relative font-mono text-2xl md:text-4xl tracking-[0.2em] text-green-400 mb-4 transition-all">
          {displayedBinary.map((char, i) => (
            <span key={i} className={char === ' ' ? 'mx-2' : ''}>{char}</span>
          ))}
        </div>
        <div className="relative text-xl md:text-2xl font-medium text-white opacity-90">
          H e l l o
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
        <button 
          onClick={onStartLearning}
          className="flex items-center justify-center gap-2 px-8 py-4 bg-green-500 hover:bg-green-400 text-black font-bold rounded-xl transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:shadow-[0_0_30px_rgba(34,197,94,0.5)]"
        >
          <Play className="w-5 h-5 fill-current" />
          Start Learning
        </button>
        <button 
          onClick={onTakeQuiz}
          className="flex items-center justify-center gap-2 px-8 py-4 bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-gray-600 text-white font-bold rounded-xl transition-all hover:scale-105 active:scale-95"
        >
          Take the Quiz
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default HeroSection;
