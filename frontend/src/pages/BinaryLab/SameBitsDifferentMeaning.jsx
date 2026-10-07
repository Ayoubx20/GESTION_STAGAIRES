import React, { useState } from 'react';
import { Layers } from 'lucide-react';

const InterpretationCard = () => {
  const [mode, setMode] = useState(null); // 'number', 'character', or null
  const bits = "01011010";
  const decimal = 90;
  const char = "Z";

  return (
    <div className="bg-[#0e0e0e] border border-gray-800 rounded-2xl p-6 md:p-8 mt-12 text-center relative overflow-hidden group hover:border-cyan-500/30 transition-colors">
      <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none"></div>
      
      <h3 className="text-2xl font-bold text-white mb-2">The Interpretation Engine</h3>
      <p className="text-gray-400 mb-8">The bits are exactly the same. Only the interpretation changes.</p>
      
      <div className="max-w-md mx-auto">
        <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 mb-8 relative">
          <div className="text-sm font-mono text-gray-500 mb-2 uppercase tracking-widest flex items-center justify-center gap-2">
            <Layers className="w-4 h-4"/> Same Bits
          </div>
          <div className="text-4xl sm:text-5xl font-black text-cyan-400 tracking-[0.2em] mb-4">
            {bits}
          </div>
          
          <div className="min-h-[120px] flex flex-col items-center justify-center">
            {!mode ? (
              <div className="text-gray-500 italic animate-pulse">Select an interpretation mode below...</div>
            ) : mode === 'number' ? (
              <div className="flex flex-col items-center animate-fade-in-up">
                <div className="text-gray-600 mb-2">↓</div>
                <div className="text-sm text-gray-500 uppercase tracking-widest mb-1">Decimal Number</div>
                <div className="text-5xl font-black text-green-400">{decimal}</div>
              </div>
            ) : (
              <div className="flex flex-col items-center animate-fade-in-up">
                <div className="text-gray-600 mb-2">↓</div>
                <div className="text-sm text-gray-500 uppercase tracking-widest mb-1">ASCII Number</div>
                <div className="text-2xl font-bold text-yellow-400 mb-2">{decimal}</div>
                <div className="text-gray-600 mb-2">↓</div>
                <div className="text-sm text-gray-500 uppercase tracking-widest mb-1">Character</div>
                <div className="text-5xl font-black text-white">{char}</div>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button 
            onClick={() => setMode('number')}
            className={`flex-1 py-4 px-6 rounded-xl font-bold text-lg border-2 transition-all flex items-center justify-center gap-3
              ${mode === 'number' ? 'bg-green-500/20 border-green-500 text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.3)]' : 'bg-gray-800 border-gray-700 text-white hover:border-gray-500'}`}
          >
            <span className="text-2xl">🔢</span> NUMBER
          </button>
          
          <button 
            onClick={() => setMode('character')}
            className={`flex-1 py-4 px-6 rounded-xl font-bold text-lg border-2 transition-all flex items-center justify-center gap-3
              ${mode === 'character' ? 'bg-yellow-500/20 border-yellow-500 text-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.3)]' : 'bg-gray-800 border-gray-700 text-white hover:border-gray-500'}`}
          >
            <span className="text-2xl">🔤</span> CHARACTER
          </button>
        </div>
      </div>
    </div>
  );
};

const TryItYourself = () => {
  const [inputVal, setInputVal] = useState(65);
  
  const clamp = (val) => Math.max(32, Math.min(126, val)); // Printable ASCII range mostly
  const ascii = clamp(inputVal || 65);
  const bin = ascii.toString(2).padStart(8, '0');
  const char = String.fromCharCode(ascii);
  
  return (
    <div className="bg-[#0e0e0e] border border-gray-800 rounded-2xl p-6 md:p-8 mt-12 flex flex-col items-center">
      <h3 className="text-2xl font-bold text-white mb-2 text-center">Try It Yourself</h3>
      <p className="text-gray-400 mb-8 text-center max-w-lg">Enter a number to see how the exact same bits look when viewed as a number versus when viewed as a character.</p>
      
      <div className="flex gap-4 items-center mb-10">
        <label className="text-gray-400 font-bold">Decimal Number:</label>
        <input 
          type="number" 
          min="32" max="126"
          value={inputVal} 
          onChange={e => setInputVal(parseInt(e.target.value) || 0)}
          className="w-24 bg-gray-900 border-2 border-gray-700 rounded-xl p-2 text-white font-mono text-xl text-center outline-none focus:border-cyan-500"
        />
      </div>
      
      <div className="text-4xl font-black text-cyan-400 tracking-[0.3em] font-mono mb-8 bg-gray-900 px-8 py-4 rounded-xl border border-gray-800 shadow-inner">
        {bin}
      </div>
      
      <div className="flex flex-col md:flex-row gap-8 w-full max-w-3xl">
        <div className="flex-1 bg-green-950/20 border border-green-500/30 rounded-xl p-6 text-center">
          <div className="text-gray-400 uppercase text-sm tracking-widest mb-4 font-bold">If we tell the computer it's a Number</div>
          <div className="text-6xl font-black text-green-400">{ascii}</div>
        </div>
        
        <div className="flex-1 bg-yellow-950/20 border border-yellow-500/30 rounded-xl p-6 text-center">
          <div className="text-gray-400 uppercase text-sm tracking-widest mb-4 font-bold">If we tell the computer it's a Character</div>
          <div className="text-6xl font-black text-yellow-400">{char === ' ' ? 'Space' : char}</div>
        </div>
      </div>
    </div>
  );
};

export default function SameBitsDifferentMeaning() {
  return (
    <div className="animate-fade-in">
      <div className="text-center mt-16 mb-8 border-t border-gray-800 pt-16">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 text-purple-400">Chapter 3: Same Bits, Different Meaning</h2>
        <p className="text-gray-400 max-w-2xl mx-auto">
          Binary does not automatically mean "number" or "character." The same sequence of bits can represent completely different things depending on how a computer interprets it.
        </p>
      </div>
      
      <InterpretationCard />
      <TryItYourself />
    </div>
  );
}
