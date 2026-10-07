import React, { useState } from 'react';

export const LearnBinarySwitch = () => {
  const [isOn, setIsOn] = useState(false);

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 md:p-8 text-center">
      <h3 className="text-2xl font-bold text-white mb-2">The Basic Concept</h3>
      <p className="text-gray-400 mb-8">Computers use combinations of 0 and 1 to represent information.</p>

      <div className="flex flex-col items-center gap-6">
        <div
          onClick={() => setIsOn(!isOn)}
          className={`w-32 h-16 rounded-full p-2 cursor-pointer transition-colors duration-300 ${isOn ? 'bg-green-500' : 'bg-gray-700'}`}
        >
          <div className={`w-12 h-12 rounded-full bg-white shadow-md transform transition-transform duration-300 flex items-center justify-center ${isOn ? 'translate-x-16' : 'translate-x-0'}`}>
            <span className={`font-bold text-xl ${isOn ? 'text-green-500' : 'text-gray-500'}`}>
              {isOn ? '1' : '0'}
            </span>
          </div>
        </div>

        <div className="text-3xl font-mono font-bold text-white flex items-center gap-4">
          <span className={!isOn ? 'text-gray-300' : 'text-gray-600'}>OFF = 0</span>
          <span className="text-gray-600">|</span>
          <span className={isOn ? 'text-green-400' : 'text-gray-600'}>ON = 1</span>
        </div>
      </div>
    </div>
  );
};

export const PlaceValues = () => {
  const [bits, setBits] = useState(Array(8).fill(0));
  const values = [128, 64, 32, 16, 8, 4, 2, 1];

  const toggleBit = (index) => {
    const newBits = [...bits];
    newBits[index] = newBits[index] === 0 ? 1 : 0;
    setBits(newBits);
  };

  const decimalValue = bits.reduce((acc, bit, idx) => acc + (bit * values[idx]), 0);
  const binaryString = bits.join('');
  const equation = bits
    .map((bit, idx) => bit ? values[idx] : null)
    .filter(v => v !== null)
    .join(' + ') || '0';

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 md:p-8">
      <h3 className="text-2xl font-bold text-white mb-2 text-center">Binary Place Values</h3>
      <p className="text-gray-400 mb-8 text-center">Click the 0s to turn them into 1s and see how the decimal number is calculated.</p>

      <div className="flex flex-col items-center max-w-3xl mx-auto overflow-x-auto pb-4">
        <div className="flex gap-2 sm:gap-4 mb-4">
          {values.map((val, idx) => (
            <div key={`val-${idx}`} className="w-10 sm:w-16 text-center text-gray-500 font-mono text-sm sm:text-base">
              {val}
            </div>
          ))}
        </div>

        <div className="flex gap-2 sm:gap-4 mb-8">
          {bits.map((bit, idx) => (
            <button
              key={`bit-${idx}`}
              onClick={() => toggleBit(idx)}
              className={`w-10 h-12 sm:w-16 sm:h-20 rounded-xl font-mono text-2xl sm:text-4xl font-bold transition-all ${bit === 1
                  ? 'bg-green-500/20 text-green-400 border-2 border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.3)]'
                  : 'bg-gray-800 text-gray-500 border-2 border-transparent hover:bg-gray-700'
                }`}
            >
              {bit}
            </button>
          ))}
        </div>

        <div className="w-full bg-gray-800 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="font-mono text-gray-300">
            {equation} = <span className="text-2xl font-bold text-white">{decimalValue}</span>
          </div>
          <div className="text-right flex flex-col gap-1">
            <div className="text-sm text-gray-400 font-mono uppercase">Binary: <span className="text-green-400 text-lg">{binaryString}</span></div>
            <div className="text-sm text-gray-400 font-mono uppercase">Decimal: <span className="text-white text-lg">{decimalValue}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const PatternChallenge = () => {
  const [answer, setAnswer] = useState('');
  const [isCorrect, setIsCorrect] = useState(null);

  const checkAnswer = (e) => {
    const val = e.target.value;
    setAnswer(val);
    if (val === '16') {
      setIsCorrect(true);
    } else if (val.length > 0) {
      setIsCorrect(false);
    } else {
      setIsCorrect(null);
    }
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 md:p-8 flex flex-col items-center text-center">
      <h3 className="text-2xl font-bold text-white mb-2">The Easy Pattern</h3>
      <p className="text-gray-400 mb-6">Every number is double the previous number!</p>

      <div className="flex flex-wrap justify-center items-center gap-4 text-xl sm:text-2xl font-mono font-bold text-white mb-8">
        <span className="text-green-400">1</span>
        <span className="text-gray-600">→</span>
        <span className="text-green-400">2</span>
        <span className="text-gray-600">→</span>
        <span className="text-green-400">4</span>
        <span className="text-gray-600">→</span>
        <span className="text-green-400">8</span>
        <span className="text-gray-600">→</span>
        <input
          type="text"
          value={answer}
          onChange={checkAnswer}
          placeholder="?"
          className={`w-20 text-center bg-gray-800 border-2 rounded-lg py-1 focus:outline-none focus:ring-2 transition-colors ${isCorrect === true ? 'border-green-500 text-green-400' :
              isCorrect === false ? 'border-red-500 text-red-400' : 'border-gray-600 text-white focus:border-cyan-500'
            }`}
        />
      </div>

      {isCorrect === true && (
        <div className="text-green-400 font-medium animate-fade-in-up">
          Correct! Next would be 32, 64, 128, 256...
        </div>
      )}
    </div>
  );
};
