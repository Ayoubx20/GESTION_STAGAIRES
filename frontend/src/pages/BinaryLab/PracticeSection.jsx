import React, { useState, useEffect } from 'react';
import { Play, RotateCcw, Zap } from 'lucide-react';
import { decimalToBinary, binaryToDecimal, charToBinary, binaryToChar, getRandomFeedback } from './utils';

const generateSpeedQuestion = () => {
  const types = ['binToDec', 'decToBin', 'binToChar', 'charToBin'];
  const type = types[Math.floor(Math.random() * types.length)];

  if (type === 'binToDec') {
    const val = Math.floor(Math.random() * 32);
    return { q: decimalToBinary(val), a: val.toString(), type };
  } else if (type === 'decToBin') {
    const val = Math.floor(Math.random() * 32);
    return { q: val.toString(), a: decimalToBinary(val), type };
  } else if (type === 'binToChar') {
    const char = String.fromCharCode(65 + Math.floor(Math.random() * 26));
    return { q: charToBinary(char), a: char, type };
  } else {
    const char = String.fromCharCode(65 + Math.floor(Math.random() * 26));
    return { q: char, a: charToBinary(char), type };
  }
};

export const PracticeSection = ({ addXp, recordAnswer, updateBestSpeedScore }) => {
  // Game 1: Guess Decimal
  const [g1Q, setG1Q] = useState(() => Math.floor(Math.random() * 15) + 1);
  const [g1Options, setG1Options] = useState([]);
  const [g1Feedback, setG1Feedback] = useState(null);

  useEffect(() => {
    const opts = [g1Q];
    while (opts.length < 4) {
      const r = Math.floor(Math.random() * 20);
      if (!opts.includes(r)) opts.push(r);
    }
    setG1Options(opts.sort(() => Math.random() - 0.5));
    setG1Feedback(null);
  }, [g1Q]);

  const handleG1 = (opt) => {
    const isCorrect = opt === g1Q;
    setG1Feedback({ text: getRandomFeedback(isCorrect), isCorrect });
    recordAnswer(isCorrect);
    if (isCorrect) {
      addXp(5);
      setTimeout(() => setG1Q(Math.floor(Math.random() * 31) + 1), 1500);
    }
  };

  // Game 4: Speed Challenge
  const [speedActive, setSpeedActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [speedScore, setSpeedScore] = useState(0);
  const [speedQ, setSpeedQ] = useState(null);
  const [speedInput, setSpeedInput] = useState('');

  useEffect(() => {
    let timer;
    if (speedActive && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
    } else if (timeLeft === 0 && speedActive) {
      setSpeedActive(false);
      updateBestSpeedScore(speedScore);
      addXp(speedScore * 10);
    }
    return () => clearInterval(timer);
  }, [speedActive, timeLeft]);

  const startSpeedGame = () => {
    setSpeedActive(true);
    setTimeLeft(30);
    setSpeedScore(0);
    setSpeedQ(generateSpeedQuestion());
    setSpeedInput('');
  };

  const handleSpeedInput = (e) => {
    const val = e.target.value.toUpperCase();
    setSpeedInput(val);

    if (val === speedQ.a) {
      setSpeedScore(s => s + 1);
      setSpeedQ(generateSpeedQuestion());
      setSpeedInput('');
      recordAnswer(true);
    }
  };

  return (
    <div className="space-y-8">
      {/* Game 1 */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <h3 className="text-xl font-bold text-white mb-4">Game 1: Guess the Decimal</h3>
        <div className="text-center mb-6">
          <div className="text-4xl font-mono text-green-400 font-bold mb-2 tracking-widest">{decimalToBinary(g1Q)}</div>
          <p className="text-gray-400">What number is this?</p>
        </div>

        <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
          {g1Options.map((opt, i) => (
            <button
              key={i}
              onClick={() => handleG1(opt)}
              className="bg-gray-800 hover:bg-gray-700 text-white font-bold py-3 rounded-xl border border-gray-700 transition-colors"
            >
              {opt}
            </button>
          ))}
        </div>

        {g1Feedback && (
          <div className={`mt-4 text-center font-bold animate-fade-in-up ${g1Feedback.isCorrect ? 'text-green-400' : 'text-red-400'}`}>
            {g1Feedback.text} {g1Feedback.isCorrect ? `(${decimalToBinary(g1Q)} = ${g1Q})` : ''}
          </div>
        )}
      </div>

      {/* Speed Challenge */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
          <Zap className="w-32 h-32 text-yellow-400" />
        </div>

        <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
          <Zap className="w-5 h-5 text-yellow-400 fill-current" />
          Binary Speed Challenge
        </h3>

        {!speedActive && timeLeft === 30 ? (
          <div className="text-center py-8">
            <p className="text-gray-400 mb-6">Answer as many conversions as you can in 30 seconds!</p>
            <button
              onClick={startSpeedGame}
              className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-3 px-8 rounded-xl transition-transform hover:scale-105 active:scale-95 shadow-[0_0_15px_rgba(234,179,8,0.3)]"
            >
              Start Challenge
            </button>
          </div>
        ) : speedActive ? (
          <div className="text-center py-6 relative z-10">
            <div className="flex justify-between items-center mb-8 px-4">
              <div className="text-yellow-400 font-mono font-bold text-xl">Time: {timeLeft}s</div>
              <div className="text-green-400 font-mono font-bold text-xl">Score: {speedScore}</div>
            </div>

            <div className="text-3xl font-mono text-white mb-6">
              {speedQ?.q} <span className="text-gray-500">→</span> ?
            </div>

            <input
              type="text"
              autoFocus
              value={speedInput}
              onChange={handleSpeedInput}
              className="w-48 bg-gray-800 text-white font-mono text-2xl p-3 rounded-xl border border-gray-700 focus:outline-none focus:border-yellow-500 text-center"
              placeholder="?"
            />
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-400 mb-2">Time's up!</p>
            <div className="text-4xl font-bold text-white mb-6">Score: <span className="text-green-400">{speedScore}</span></div>
            <button
              onClick={startSpeedGame}
              className="bg-gray-800 hover:bg-gray-700 text-white border border-gray-700 font-bold py-3 px-8 rounded-xl transition-colors flex items-center gap-2 mx-auto"
            >
              <RotateCcw className="w-5 h-5" />
              Play Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
