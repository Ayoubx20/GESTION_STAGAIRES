import React, { useState, useEffect, useRef } from 'react';
import { ChevronRight, Check } from 'lucide-react';

const UPPER = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i));
const LOWER = Array.from({ length: 26 }, (_, i) => String.fromCharCode(97 + i));
const toBin8 = (n) => n.toString(2).padStart(8, '0');
const toAscii = (c) => c.charCodeAt(0);

// ─── Robot Guide ─────────────────────────────────────────────────────────────
const Robot = ({ mood = 'normal' }) => {
  const eyeColor = mood === 'happy' ? '#00ff88' : mood === 'sad' ? '#ff4444' : '#00ccff';
  const bodyColor = mood === 'happy' ? '#1a3a2a' : mood === 'sad' ? '#3a1a1a' : '#1a2a3a';
  
  return (
    <div className="relative inline-block select-none" style={{ fontSize: 0 }}>
      <svg width="64" height="80" viewBox="0 0 96 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        <line x1="48" y1="0" x2="48" y2="16" stroke="#555" strokeWidth="3" strokeLinecap="round" />
        <circle cx="48" cy="0" r="5" fill={eyeColor} style={{ filter: `drop-shadow(0 0 6px ${eyeColor})` }} />
        <rect x="16" y="16" width="64" height="50" rx="10" fill={bodyColor} stroke="#333" strokeWidth="2" />
        <rect x="24" y="28" width="18" height="14" rx="4" fill="#111" />
        <rect x="54" y="28" width="18" height="14" rx="4" fill="#111" />
        <circle cx="33" cy="35" r="5" fill={eyeColor} style={{ filter: `drop-shadow(0 0 8px ${eyeColor})` }} />
        <circle cx="63" cy="35" r="5" fill={eyeColor} style={{ filter: `drop-shadow(0 0 8px ${eyeColor})` }} />
        {mood === 'happy' ? <path d="M 30 52 Q 48 64 66 52" stroke={eyeColor} strokeWidth="3" fill="none" strokeLinecap="round" /> : mood === 'sad' ? <path d="M 30 62 Q 48 52 66 62" stroke="#ff4444" strokeWidth="3" fill="none" strokeLinecap="round" /> : <rect x="30" y="52" width="36" height="6" rx="3" fill="#333" />}
        <rect x="20" y="70" width="56" height="40" rx="8" fill={bodyColor} stroke="#333" strokeWidth="2" />
        <rect x="30" y="78" width="36" height="24" rx="4" fill="#111" />
        <circle cx="38" cy="86" r="4" fill={eyeColor} opacity="0.7" />
        <circle cx="58" cy="86" r="4" fill="#ff9900" opacity="0.7" />
      </svg>
    </div>
  );
};

// ─── 1. Visual Intro ─────────────────────────────────────────────────────────
const VisualIntro = () => {
  const [activeIdx, setActiveIdx] = useState(2);
  const letters = UPPER.slice(0, 7);
  
  return (
    <div className="bg-[#0e0e0e] border border-gray-800 rounded-2xl p-6 md:p-8 text-center mt-12">
      <h3 className="text-2xl font-bold text-white mb-2">Characters Have Numbers Too!</h3>
      <p className="text-gray-400 mb-8">Every letter has a position, and that position helps us find its ASCII number.</p>
      
      <div className="flex justify-center gap-2 sm:gap-6 mb-4">
        {letters.map((c, i) => (
          <div key={i} className={`flex flex-col items-center cursor-pointer transition-all ${activeIdx === i ? 'scale-125' : 'opacity-50 hover:opacity-100'}`} onClick={() => setActiveIdx(i)}>
            <div className={`text-2xl font-black font-mono ${activeIdx === i ? 'text-green-400' : 'text-white'}`}>{c}</div>
            <div className={`text-sm font-mono mt-2 ${activeIdx === i ? 'text-yellow-400' : 'text-gray-500'}`}>{i + 1}</div>
          </div>
        ))}
      </div>
      
      <div className="h-16 flex flex-col items-center justify-center animate-fade-in-up">
        <div className="text-gray-500">↑</div>
        <div className="text-green-400 font-bold">{activeIdx + 1}{activeIdx === 0 ? 'st' : activeIdx === 1 ? 'nd' : activeIdx === 2 ? 'rd' : 'th'} letter</div>
      </div>
    </div>
  );
};

// ─── 2. ASCII Starting Point ─────────────────────────────────────────────────
const AsciiStartingPoint = () => {
  const [activeIdx, setActiveIdx] = useState(2);
  const letters = UPPER.slice(0, 5);
  
  return (
    <div className="bg-[#0e0e0e] border border-gray-800 rounded-2xl p-6 md:p-8 mt-12 flex flex-col md:flex-row gap-8 items-center">
      <div className="flex-1">
        <h3 className="text-2xl font-bold text-white mb-2">The ASCII Starting Point</h3>
        <p className="text-gray-400 mb-4">A always starts at <strong className="text-yellow-400">65</strong>. To find any other uppercase letter, just add its position minus 1!</p>
        <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 font-mono text-sm sm:text-base inline-block">
          <span className="text-white font-bold">ASCII</span> = <span className="text-yellow-400">65</span> + (<span className="text-green-400">position</span> - 1)
        </div>
      </div>
      
      <div className="flex-1 w-full bg-gray-900 border border-gray-800 rounded-xl p-4 font-mono">
        {letters.map((c, i) => (
          <div key={i} className={`flex items-center gap-4 py-2 px-3 rounded-lg cursor-pointer transition-colors ${activeIdx === i ? 'bg-gray-800 border border-gray-700' : 'hover:bg-gray-800/50'}`} onClick={() => setActiveIdx(i)}>
            <span className={`text-xl font-black ${activeIdx === i ? 'text-cyan-400' : 'text-gray-400'}`}>{c}</span>
            <span className="text-gray-500">=</span>
            <span className="text-yellow-400">65</span>
            <span className="text-gray-500">+</span>
            <span className="text-green-400">{i}</span>
            <span className="text-gray-500">=</span>
            <span className={`font-bold ${activeIdx === i ? 'text-white' : 'text-gray-400'}`}>{65 + i}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── 3. Character Place-Value Visualizer ─────────────────────────────────────
const Visualizer = () => {
  const [step, setStep] = useState(0); // 0-3
  
  const reset = () => setStep(0);
  const next = () => setStep(s => Math.min(s + 1, 3));
  
  return (
    <div className="bg-[#0e0e0e] border border-gray-800 rounded-2xl p-6 md:p-8 mt-12 text-center relative overflow-hidden">
      <h3 className="text-2xl font-bold text-white mb-6">See the Transformation</h3>
      
      <div className="flex flex-col items-center gap-4 font-mono mb-8 min-h-[300px]">
        {/* Step 0: Character */}
        <div className="flex flex-col items-center animate-fade-in-up">
          <span className="text-xs text-gray-500 uppercase tracking-widest mb-1">Character</span>
          <span className="text-5xl font-black text-cyan-400">C</span>
        </div>
        
        {/* Step 1: Position */}
        {step >= 1 && (
          <div className="flex flex-col items-center animate-fade-in-up">
            <span className="text-gray-600 mb-2">↓</span>
            <span className="text-xs text-gray-500 uppercase tracking-widest mb-1">Alphabet Position</span>
            <span className="text-3xl font-bold text-green-400">3</span>
          </div>
        )}
        
        {/* Step 2: ASCII */}
        {step >= 2 && (
          <div className="flex flex-col items-center animate-fade-in-up">
            <span className="text-gray-600 mb-2">↓</span>
            <span className="text-xs text-gray-500 uppercase tracking-widest mb-1">ASCII Value</span>
            <span className="text-xl text-gray-400">65 + 2 = <strong className="text-3xl text-yellow-400">67</strong></span>
          </div>
        )}
        
        {/* Step 3: Binary */}
        {step >= 3 && (
          <div className="flex flex-col items-center animate-fade-in-up">
            <span className="text-gray-600 mb-2">↓</span>
            <span className="text-xs text-gray-500 uppercase tracking-widest mb-1">Binary</span>
            <span className="text-3xl font-black text-white tracking-[0.2em] shadow-lg">01000011</span>
          </div>
        )}
      </div>
      
      <div className="flex justify-center gap-4">
        {step < 3 ? (
          <button onClick={next} className="px-8 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl flex items-center gap-2 transition-all">Next Step <ChevronRight className="w-5 h-5"/></button>
        ) : (
          <button onClick={reset} className="px-8 py-3 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-xl transition-all">Reset</button>
        )}
      </div>
    </div>
  );
};

// ─── 4. Letter Slider ────────────────────────────────────────────────────────
const LetterSlider = () => {
  const [idx, setIdx] = useState(2); // C
  const [lowerUnlocked, setLowerUnlocked] = useState(false);
  const [isLower, setIsLower] = useState(false);
  
  const pool = isLower ? LOWER : UPPER;
  const char = pool[idx];
  const pos = idx + 1;
  const ascii = toAscii(char);
  const bin = toBin8(ascii);
  
  return (
    <div className="bg-[#0e0e0e] border border-gray-800 rounded-2xl p-6 md:p-8 mt-12">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-bold text-white">Interactive Alphabet</h3>
        {lowerUnlocked ? (
          <button onClick={() => setIsLower(!isLower)} className="text-sm bg-gray-800 hover:bg-gray-700 px-3 py-1 rounded-lg text-gray-300 font-mono">
            Switch to {isLower ? 'A-Z' : 'a-z'}
          </button>
        ) : (
          <button onClick={() => setLowerUnlocked(true)} className="text-sm bg-gray-900 border border-gray-700 px-3 py-1 rounded-lg text-gray-500 font-mono">
            Unlock Lowercase
          </button>
        )}
      </div>
      
      <div className="mb-10 px-4">
        <div className="flex justify-between text-gray-500 font-mono text-sm mb-2">
          <span>{pool[0]}</span>
          <span>{pool[25]}</span>
        </div>
        <input 
          type="range" min="0" max="25" value={idx} onChange={e => setIdx(parseInt(e.target.value))}
          className="w-full accent-green-500 bg-gray-800 h-2 rounded-lg appearance-none cursor-pointer"
        />
      </div>
      
      <div className="flex flex-col md:flex-row gap-6 justify-between items-center bg-gray-900 border border-gray-800 rounded-xl p-6 text-center font-mono">
        <div className="flex flex-col">
          <span className="text-gray-500 text-xs uppercase mb-1">Character</span>
          <span className="text-5xl font-black text-cyan-400">{char}</span>
        </div>
        <div className="hidden md:block text-gray-700 text-2xl">→</div>
        <div className="flex flex-col">
          <span className="text-gray-500 text-xs uppercase mb-1">Position</span>
          <span className="text-3xl font-bold text-green-400">{pos}</span>
        </div>
        <div className="hidden md:block text-gray-700 text-2xl">→</div>
        <div className="flex flex-col">
          <span className="text-gray-500 text-xs uppercase mb-1">ASCII ({isLower?'97':'65'} + {idx})</span>
          <span className="text-3xl font-bold text-yellow-400">{ascii}</span>
        </div>
        <div className="hidden md:block text-gray-700 text-2xl">→</div>
        <div className="flex flex-col">
          <span className="text-gray-500 text-xs uppercase mb-1">Binary</span>
          <span className="text-2xl font-black text-white tracking-widest">{bin}</span>
        </div>
      </div>
    </div>
  );
};

// ─── 6. Build the Character Game ─────────────────────────────────────────────
const BuildCharacterGame = () => {
  const [num, setNum] = useState(() => 65 + Math.floor(Math.random() * 26));
  const [feedback, setFeedback] = useState(null);
  
  const correctChar = String.fromCharCode(num);
  const letters = UPPER;
  
  const handle = (c) => {
    if (c === correctChar) {
      setFeedback({ msg: `🤖 ${c} FOUND!`, correct: true });
      setTimeout(() => {
        setNum(65 + Math.floor(Math.random() * 26));
        setFeedback(null);
      }, 1500);
    } else {
      setFeedback({ msg: "🤖 BZZT! Check the letter position!", correct: false });
      setTimeout(() => setFeedback(null), 1000);
    }
  };
  
  return (
    <div className="bg-[#0e0e0e] border border-gray-800 rounded-2xl p-6 md:p-8 mt-12 text-center">
      <div className="flex justify-center mb-4"><Robot mood={feedback?.correct ? 'happy' : feedback?.correct === false ? 'sad' : 'normal'} /></div>
      <h3 className="text-xl font-bold text-white mb-2">Which character is hiding inside?</h3>
      <div className="text-6xl font-black text-yellow-400 mb-8 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]">{num}</div>
      
      <div className="flex flex-wrap gap-2 justify-center max-w-2xl mx-auto mb-6">
        {letters.map((c, i) => (
          <button key={i} onClick={() => handle(c)} className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-900 hover:bg-gray-800 border-2 border-gray-700 hover:border-cyan-400 rounded-lg font-mono text-xl text-white font-bold transition-all active:scale-95">
            {c}
          </button>
        ))}
      </div>
      
      {feedback && (
        <div className={`font-bold animate-fade-in-up ${feedback.correct ? 'text-green-400' : 'text-red-400'}`}>
          {feedback.msg}
        </div>
      )}
    </div>
  );
};

// ─── 9. The Final Challenge ──────────────────────────────────────────────────
const FinalChallenge = () => {
  const [char, setChar] = useState(() => UPPER[Math.floor(Math.random() * 26)]);
  const [step, setStep] = useState(1);
  const [val, setVal] = useState('');
  const [feedback, setFeedback] = useState(null);
  
  const pos = UPPER.indexOf(char) + 1;
  const ascii = toAscii(char);
  const bin = toBin8(ascii);
  
  const check = () => {
    let correct = false;
    if (step === 1 && parseInt(val) === pos) correct = true;
    if (step === 2 && parseInt(val) === ascii) correct = true;
    if (step === 3 && val === bin) correct = true;
    
    if (correct) {
      if (step === 3) {
        setFeedback({ msg: "🤖 ASCII CIRCUITS FULLY ACTIVATED! MASTER DECODER!", correct: true });
        setTimeout(() => {
          setChar(UPPER[Math.floor(Math.random() * 26)]);
          setStep(1);
          setVal('');
          setFeedback(null);
        }, 2500);
      } else {
        setStep(s => s + 1);
        setVal('');
        setFeedback(null);
      }
    } else {
      setFeedback({ msg: "🤖 Almost! Try recalculating.", correct: false });
      setTimeout(() => setFeedback(null), 1500);
    }
  };
  
  return (
    <div className="bg-[#0e0e0e] border-2 border-green-500/30 rounded-2xl p-6 md:p-8 mt-12 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-green-500 to-transparent opacity-50"></div>
      <h3 className="text-2xl font-bold text-white mb-2 text-center">Final Challenge: Complete the Chain</h3>
      <p className="text-gray-400 mb-8 text-center">Prove your understanding. Turn the letter into binary.</p>
      
      <div className="flex flex-col items-center font-mono max-w-sm mx-auto">
        <div className="text-5xl font-black text-cyan-400 mb-4">{char}</div>
        
        {/* Step 1 */}
        <div className="flex flex-col items-center w-full mb-4">
          <div className="text-gray-600 mb-2">↓</div>
          {step > 1 ? (
            <div className="text-xl text-green-400 font-bold">Position: {pos}</div>
          ) : step === 1 ? (
            <div className="flex flex-col items-center gap-2 w-full animate-fade-in-up">
              <label className="text-sm text-gray-400">Alphabet Position?</label>
              <input type="number" value={val} onChange={e => setVal(e.target.value)} onKeyDown={e => e.key === 'Enter' && check()} className="w-24 bg-gray-900 text-center text-white text-xl p-2 rounded-lg border border-gray-700 outline-none focus:border-green-500" placeholder="?" autoFocus />
              <button onClick={check} className="px-4 py-1 bg-green-600 text-black font-bold rounded-lg mt-2">Check</button>
            </div>
          ) : null}
        </div>
        
        {/* Step 2 */}
        {step >= 2 && (
          <div className="flex flex-col items-center w-full mb-4">
            <div className="text-gray-600 mb-2">↓</div>
            {step > 2 ? (
              <div className="text-xl text-yellow-400 font-bold">ASCII: {ascii}</div>
            ) : step === 2 ? (
              <div className="flex flex-col items-center gap-2 w-full animate-fade-in-up">
                <label className="text-sm text-gray-400">ASCII Value? (65 + pos - 1)</label>
                <input type="number" value={val} onChange={e => setVal(e.target.value)} onKeyDown={e => e.key === 'Enter' && check()} className="w-24 bg-gray-900 text-center text-white text-xl p-2 rounded-lg border border-gray-700 outline-none focus:border-green-500" placeholder="?" autoFocus />
                <button onClick={check} className="px-4 py-1 bg-green-600 text-black font-bold rounded-lg mt-2">Check</button>
              </div>
            ) : null}
          </div>
        )}
        
        {/* Step 3 */}
        {step >= 3 && (
          <div className="flex flex-col items-center w-full">
            <div className="text-gray-600 mb-2">↓</div>
            <div className="flex flex-col items-center gap-2 w-full animate-fade-in-up">
              <label className="text-sm text-gray-400">8-bit Binary?</label>
              <input type="text" maxLength={8} value={val} onChange={e => setVal(e.target.value.replace(/[^01]/g, ''))} onKeyDown={e => e.key === 'Enter' && check()} className="w-48 bg-gray-900 text-center text-white text-2xl tracking-[0.2em] p-2 rounded-lg border border-gray-700 outline-none focus:border-green-500" placeholder="00000000" autoFocus />
              <button onClick={check} className="px-6 py-2 bg-green-600 text-black font-bold rounded-lg mt-2 flex items-center gap-2"><Check className="w-4 h-4"/> Submit</button>
            </div>
          </div>
        )}
        
        {feedback && (
          <div className={`mt-6 font-bold text-center animate-fade-in-up ${feedback.correct ? 'text-green-400' : 'text-red-400'}`}>
            {feedback.msg}
          </div>
        )}
      </div>
    </div>
  );
};

export default function CharacterPlaceValues() {
  return (
    <div className="animate-fade-in">
      <div className="text-center mt-16 mb-8 border-t border-gray-800 pt-16">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 text-cyan-400">Chapter 2: Character Positions</h2>
        <p className="text-gray-400">How do computers turn letters into numbers?</p>
      </div>
      
      <VisualIntro />
      <AsciiStartingPoint />
      <Visualizer />
      <LetterSlider />
      <BuildCharacterGame />
      <FinalChallenge />
    </div>
  );
}
