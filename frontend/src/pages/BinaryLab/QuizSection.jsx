import React, { useState, useEffect, useCallback } from 'react';
import { decimalToBinary, binaryToDecimal, charToBinary, binaryToChar } from './utils';
import { Check, X, Award, RotateCcw } from 'lucide-react';

const generateQuiz = (level) => {
  const questions = [];
  const qCount = 5;
  
  for(let i=0; i<qCount; i++) {
    let qType = Math.floor(Math.random() * 2);
    if (level === 1) {
      // Beginner: Simple powers of 2, small binary -> decimal
      const num = Math.floor(Math.random() * 15) + 1; // 1-15
      if (qType === 0) {
        questions.push({
          q: `What is the decimal value of ${decimalToBinary(num)}?`,
          a: num.toString(),
          options: generateOptions(num.toString(), () => Math.floor(Math.random() * 20).toString())
        });
      } else {
        questions.push({
          q: `How do you write ${num} in binary?`,
          a: decimalToBinary(num),
          options: generateOptions(decimalToBinary(num), () => decimalToBinary(Math.floor(Math.random() * 20)))
        });
      }
    } else if (level === 2) {
      // Intermediate: 8-bit binary, ASCII
      qType = Math.floor(Math.random() * 3);
      if (qType === 0) {
        const num = Math.floor(Math.random() * 255);
        questions.push({
          q: `Convert ${num} to binary:`,
          a: decimalToBinary(num).padStart(8, '0'),
          options: generateOptions(decimalToBinary(num).padStart(8, '0'), () => decimalToBinary(Math.floor(Math.random() * 255)).padStart(8, '0'))
        });
      } else if (qType === 1) {
        const char = String.fromCharCode(65 + Math.floor(Math.random() * 26));
        questions.push({
          q: `What is the binary representation of '${char}'?`,
          a: charToBinary(char),
          options: generateOptions(charToBinary(char), () => charToBinary(String.fromCharCode(65 + Math.floor(Math.random() * 26))))
        });
      } else {
        const char = String.fromCharCode(65 + Math.floor(Math.random() * 26));
        const bin = charToBinary(char);
        questions.push({
          q: `Which character is represented by ${bin}?`,
          a: char,
          options: generateOptions(char, () => String.fromCharCode(65 + Math.floor(Math.random() * 26)))
        });
      }
    } else {
      // Challenge: Hexadecimal, arithmetic, mixed
      qType = Math.floor(Math.random() * 3);
      if (qType === 0) {
        const num = Math.floor(Math.random() * 255);
        questions.push({
          q: `Convert ${decimalToBinary(num)} to Hexadecimal:`,
          a: num.toString(16).toUpperCase(),
          options: generateOptions(num.toString(16).toUpperCase(), () => Math.floor(Math.random() * 255).toString(16).toUpperCase())
        });
      } else if (qType === 1) {
        const n1 = Math.floor(Math.random() * 10) + 1;
        const n2 = Math.floor(Math.random() * 10) + 1;
        questions.push({
          q: `Calculate: ${decimalToBinary(n1)} + ${decimalToBinary(n2)} (in binary)`,
          a: decimalToBinary(n1 + n2),
          options: generateOptions(decimalToBinary(n1 + n2), () => decimalToBinary(Math.floor(Math.random() * 30)))
        });
      } else {
        const num = Math.floor(Math.random() * 255);
        questions.push({
          q: `What is ${num.toString(16).toUpperCase()} (Hex) in Decimal?`,
          a: num.toString(),
          options: generateOptions(num.toString(), () => Math.floor(Math.random() * 255).toString())
        });
      }
    }
  }
  return questions;
};

const generateOptions = (correct, generator) => {
  const opts = new Set([correct]);
  while(opts.size < 4) {
    opts.add(generator());
  }
  return Array.from(opts).sort(() => Math.random() - 0.5);
};

export const QuizSection = ({ addXp, recordAnswer, unlockAchievement }) => {
  const [level, setLevel] = useState(null); // 1, 2, 3
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [selectedOpt, setSelectedOpt] = useState(null);
  const [isCorrect, setIsCorrect] = useState(null);

  const startQuiz = (lvl) => {
    setLevel(lvl);
    setQuestions(generateQuiz(lvl));
    setCurrentIndex(0);
    setScore(0);
    setIsFinished(false);
    setSelectedOpt(null);
    setIsCorrect(null);
  };

  const handleAnswer = (opt) => {
    if (selectedOpt) return;
    setSelectedOpt(opt);
    const correct = opt === questions[currentIndex].a;
    setIsCorrect(correct);
    recordAnswer(correct);
    
    if (correct) setScore(s => s + 1);

    setTimeout(() => {
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(i => i + 1);
        setSelectedOpt(null);
        setIsCorrect(null);
      } else {
        setIsFinished(true);
        // Calculate XP
        const newScore = correct ? score + 1 : score;
        const xpEarned = newScore * level * 20;
        addXp(xpEarned);
        if (newScore === questions.length) unlockAchievement('perfect_10');
      }
    }, 1500);
  };

  if (!level) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { l: 1, name: 'Beginner', desc: '0s and 1s, powers of 2', color: 'from-green-500 to-green-600' },
          { l: 2, name: 'Intermediate', desc: '8-bit binary, ASCII', color: 'from-blue-500 to-blue-600' },
          { l: 3, name: 'Challenge', desc: 'Hexadecimal, Math', color: 'from-purple-500 to-purple-600' }
        ].map(card => (
          <div key={card.l} onClick={() => startQuiz(card.l)} className="bg-gray-900 border border-gray-800 rounded-2xl p-6 cursor-pointer hover:border-gray-600 transition-all hover:-translate-y-1 group">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center mb-4 shadow-lg`}>
              <span className="text-white font-bold text-xl">{card.l}</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">{card.name}</h3>
            <p className="text-gray-400 text-sm">{card.desc}</p>
          </div>
        ))}
      </div>
    );
  }

  if (isFinished) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 text-center max-w-lg mx-auto">
        <Award className={`w-20 h-20 mx-auto mb-4 ${score === questions.length ? 'text-yellow-400' : 'text-gray-500'}`} />
        <h3 className="text-3xl font-bold text-white mb-2">Quiz Complete!</h3>
        <p className="text-gray-400 mb-6">Level {level} • Score: {score}/{questions.length}</p>
        
        <div className="bg-gray-800 rounded-xl p-4 mb-8">
          <p className="text-green-400 font-bold text-xl">+{score * level * 20} XP Earned</p>
        </div>
        
        <div className="flex gap-4 justify-center">
          <button onClick={() => setLevel(null)} className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl transition-colors font-medium">
            Menu
          </button>
          <button onClick={() => startQuiz(level)} className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl transition-colors font-medium flex items-center gap-2">
            <RotateCcw className="w-4 h-4" /> Try Again
          </button>
        </div>
      </div>
    );
  }

  const q = questions[currentIndex];

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 md:p-10 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div className="text-gray-400 font-medium">Level {level}</div>
        <div className="text-white font-mono font-bold bg-gray-800 px-3 py-1 rounded">
          {currentIndex + 1} / {questions.length}
        </div>
      </div>
      
      <h3 className="text-2xl md:text-3xl font-bold text-white mb-8 text-center leading-relaxed">
        {q.q}
      </h3>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {q.options.map((opt, i) => {
          let btnClass = "bg-gray-800 border-gray-700 hover:bg-gray-700 text-white";
          if (selectedOpt === opt) {
            btnClass = isCorrect 
              ? "bg-green-500/20 border-green-500 text-green-400" 
              : "bg-red-500/20 border-red-500 text-red-400";
          } else if (selectedOpt && opt === q.a) {
            btnClass = "bg-green-500/20 border-green-500 text-green-400"; // Show correct answer if missed
          }

          return (
            <button 
              key={i}
              disabled={!!selectedOpt}
              onClick={() => handleAnswer(opt)}
              className={`p-4 border-2 rounded-xl text-lg font-mono transition-all relative ${btnClass}`}
            >
              {opt}
              {selectedOpt === opt && isCorrect && <Check className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-green-400" />}
              {selectedOpt === opt && !isCorrect && <X className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-red-400" />}
            </button>
          );
        })}
      </div>
    </div>
  );
};
