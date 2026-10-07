import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Zap, Star, RotateCcw, Lightbulb, Check, ChevronRight, Lock } from 'lucide-react';

// ─── Helpers ────────────────────────────────────────────────────────────────
const toBin8 = (n) => n.toString(2).padStart(8, '0');
const toAscii = (c) => c.charCodeAt(0);
const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);
const pickWrong = (correct, pool, count = 3) => shuffle(pool.filter(x => x !== correct)).slice(0, count);

const CORRECT_MSGS = [
  "🤖 BEEP! PERFECT!",
  "That's byte-tiful!",
  "CPU APPROVES!",
  "🤖 01100011 01101111 01101111 01101100 !",
  "You're teaching a robot faster than its developers."
];
const WRONG_MSGS = [
  "404: Letter not found.",
  "🤖 I blame the motherboard.",
  "BZZT! The alphabet escaped!",
  "Almost! The bits betrayed you.",
  "Try again, human."
];

const getRand = (arr) => arr[Math.floor(Math.random() * arr.length)];

const UPPER = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i));
const LOWER = Array.from({ length: 26 }, (_, i) => String.fromCharCode(97 + i));
const WORDS = ['HI', 'CAT', 'DOG', 'CODE', 'HELLO', 'CPU', 'APP', 'WEB', 'BUG', 'DEV'];
const MESSAGES = ['HI', 'OK', 'CODE', 'HELLO', 'BINARY', 'GOOD JOB', 'ROBOT', 'HUMAN'];

// ─── SVG Robot ───────────────────────────────────────────────────────────────
const Robot = ({ mood = 'normal', speaking = false }) => {
  const eyeColor = mood === 'happy' ? '#00ff88' : mood === 'sad' ? '#ff4444' : '#00ccff';
  const bodyColor = mood === 'happy' ? '#1a3a2a' : mood === 'sad' ? '#3a1a1a' : '#1a2a3a';

  return (
    <div className={`relative inline-block select-none ${speaking ? 'animate-bounce' : ''}`} style={{ fontSize: 0 }}>
      <svg width="96" height="120" viewBox="0 0 96 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Antenna */}
        <line x1="48" y1="0" x2="48" y2="16" stroke="#555" strokeWidth="3" strokeLinecap="round" />
        <circle cx="48" cy="0" r="5" fill={eyeColor} style={{ filter: `drop-shadow(0 0 6px ${eyeColor})` }} />
        {/* Head */}
        <rect x="16" y="16" width="64" height="50" rx="10" fill={bodyColor} stroke="#333" strokeWidth="2" />
        {/* Eyes */}
        <rect x="24" y="28" width="18" height="14" rx="4" fill="#111" />
        <rect x="54" y="28" width="18" height="14" rx="4" fill="#111" />
        <circle cx="33" cy="35" r="5" fill={eyeColor} style={{ filter: `drop-shadow(0 0 8px ${eyeColor})` }} />
        <circle cx="63" cy="35" r="5" fill={eyeColor} style={{ filter: `drop-shadow(0 0 8px ${eyeColor})` }} />
        {/* Mouth */}
        {mood === 'happy'
          ? <path d="M 30 52 Q 48 64 66 52" stroke={eyeColor} strokeWidth="3" fill="none" strokeLinecap="round" />
          : mood === 'sad'
          ? <path d="M 30 62 Q 48 52 66 62" stroke="#ff4444" strokeWidth="3" fill="none" strokeLinecap="round" />
          : <rect x="30" y="52" width="36" height="6" rx="3" fill="#333" />
        }
        {/* Body */}
        <rect x="20" y="70" width="56" height="40" rx="8" fill={bodyColor} stroke="#333" strokeWidth="2" />
        <rect x="30" y="78" width="36" height="24" rx="4" fill="#111" />
        <circle cx="38" cy="86" r="4" fill={eyeColor} opacity="0.7" style={{ filter: `drop-shadow(0 0 4px ${eyeColor})` }} />
        <circle cx="58" cy="86" r="4" fill="#ff9900" opacity="0.7" />
        <rect x="34" y="95" width="28" height="3" rx="1" fill="#333" />
        {/* Arms/Legs */}
        <rect x="2" y="72" width="14" height="30" rx="6" fill={bodyColor} stroke="#333" strokeWidth="2" />
        <rect x="80" y="72" width="14" height="30" rx="6" fill={bodyColor} stroke="#333" strokeWidth="2" />
        <rect x="26" y="110" width="16" height="10" rx="4" fill={bodyColor} stroke="#333" strokeWidth="2" />
        <rect x="54" y="110" width="16" height="10" rx="4" fill={bodyColor} stroke="#333" strokeWidth="2" />
      </svg>
    </div>
  );
};

// ─── Custom UI Components ────────────────────────────────────────────────────
const FeedbackBubble = ({ msg, isCorrect }) => {
  if (!msg) return null;
  return (
    <div className={`mt-4 rounded-xl px-4 py-3 text-sm font-bold text-center animate-fade-in-up w-full max-w-sm mx-auto
      ${isCorrect ? 'bg-green-500/20 text-green-300 border border-green-500/30' : 'bg-red-500/20 text-red-300 border border-red-500/30'}`}>
      {msg}
    </div>
  );
};

const HintSystem = ({ hints, hintIndex, onRevealHint }) => {
  if (hints.length === 0) return null;
  return (
    <div className="mt-6 flex flex-col items-center">
      {hintIndex < hints.length && (
        <button onClick={onRevealHint} className="flex items-center gap-2 text-xs text-yellow-500 hover:text-yellow-400 font-bold bg-yellow-500/10 px-3 py-1.5 rounded-full transition-colors border border-yellow-500/20 mb-2">
          <Lightbulb className="w-4 h-4" /> Need a hint? ({hintIndex}/{hints.length})
        </button>
      )}
      {hintIndex > 0 && (
        <div className="bg-yellow-950/30 border border-yellow-500/20 rounded-xl p-3 text-sm text-yellow-200/80 font-mono w-full max-w-sm text-center">
          {hints[hintIndex - 1]}
        </div>
      )}
    </div>
  );
};

// ─── Levels Implementation ───────────────────────────────────────────────────

// Level 1: Guess the Letter
const Level1 = ({ onCorrect, onWrong, hints, hintIndex, setHintIndex }) => {
  const [num, setNum] = useState(() => 65 + Math.floor(Math.random() * 26));
  const [opts, setOpts] = useState([]);

  useEffect(() => {
    const correct = String.fromCharCode(num);
    const wrong = shuffle(UPPER.filter(c => c !== correct)).slice(0, 3);
    setOpts(shuffle([correct, ...wrong]));
  }, [num]);

  useEffect(() => {
    // Dynamic hints
    const h = [
      "A starts at 65. Count forward from there!",
      `If A = 65, then B = 66, C = 67...`,
      `This letter is ${num - 65 + 1}th in the alphabet.`
    ];
    hints.current = h;
    setHintIndex(0);
  }, [num, hints, setHintIndex]);

  const handle = (opt) => {
    if (opt === String.fromCharCode(num)) {
      onCorrect();
      setTimeout(() => setNum(65 + Math.floor(Math.random() * 26)), 600);
    } else onWrong();
  };

  return (
    <div className="text-center w-full">
      <h3 className="text-lg font-bold text-gray-400 mb-6 font-mono">Which letter is this ASCII number?</h3>
      <div className="text-7xl font-black text-yellow-400 mb-8 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]">{num}</div>
      <div className="flex justify-center gap-3 flex-wrap max-w-xs mx-auto">
        {opts.map((opt, i) => (
          <button key={i} onClick={() => handle(opt)} className="w-14 h-14 bg-[#0e0e0e] hover:bg-gray-800 border-2 border-gray-700 hover:border-yellow-500 text-white font-black text-2xl rounded-xl transition-all hover:scale-110 active:scale-95">
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
};

// Level 2: Build the Binary
const BIT_VALUES = [128, 64, 32, 16, 8, 4, 2, 1];
const Level2 = ({ onCorrect, onWrong, hints, hintIndex, setHintIndex }) => {
  const [char, setChar] = useState(() => UPPER[Math.floor(Math.random() * 26)]);
  const [switches, setSwitches] = useState(Array(8).fill(0));
  const ascii = toAscii(char);
  const current = switches.reduce((acc, b, i) => acc + b * BIT_VALUES[i], 0);

  useEffect(() => {
    hints.current = [
      "Find the largest place value that fits into the target number.",
      `Can you subtract ${BIT_VALUES.find(v => v <= ascii)} from ${ascii}?`,
      `The binary you need starts with 0100...`
    ];
    setHintIndex(0);
  }, [ascii, hints, setHintIndex]);

  const toggle = (i) => {
    const s = [...switches];
    s[i] = s[i] ? 0 : 1;
    setSwitches(s);
  };

  const check = () => {
    if (current === ascii) {
      onCorrect();
      setTimeout(() => {
        setChar(UPPER[Math.floor(Math.random() * 26)]);
        setSwitches(Array(8).fill(0));
      }, 1000);
    } else {
      onWrong();
    }
  };

  return (
    <div className="text-center w-full">
      <div className="flex items-center justify-center gap-4 mb-6 text-2xl font-mono">
        <span className="text-4xl font-black text-cyan-400">{char}</span>
        <span className="text-gray-600">→</span>
        <span className="text-3xl font-bold text-white">{ascii}</span>
      </div>
      
      <p className="text-sm text-gray-400 mb-6">Flip switches to build <span className="text-white font-bold">{ascii}</span></p>
      
      <div className="flex flex-wrap gap-1 sm:gap-2 justify-center mb-6">
        {BIT_VALUES.map((val, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <span className="text-[10px] text-gray-500 font-mono">{val}</span>
            <button onClick={() => toggle(i)} className={`w-8 h-12 sm:w-10 sm:h-14 rounded-lg font-mono text-lg font-bold border-2 transition-all ${
              switches[i] ? 'bg-green-500/20 border-green-500 text-green-400 shadow-[0_0_10px_rgba(34,197,94,0.4)]' : 'bg-[#0e0e0e] border-gray-700 text-gray-600 hover:border-gray-500'
            }`}>
              {switches[i]}
            </button>
          </div>
        ))}
      </div>
      
      <div className="mb-6 flex flex-col items-center">
        <div className="text-sm font-mono text-gray-500 uppercase">Current Value</div>
        <div className={`text-4xl font-black transition-colors ${current === ascii ? 'text-green-400' : current > ascii ? 'text-red-400' : 'text-white'}`}>
          {current}
        </div>
        <div className="text-xs font-bold mt-1 min-h-[16px]">
          {current > ascii && <span className="text-red-400">Too high!</span>}
          {current < ascii && current > 0 && <span className="text-yellow-400">Keep going...</span>}
          {current === ascii && <span className="text-green-400">Perfect match!</span>}
        </div>
      </div>
      
      <button onClick={check} className="px-8 py-3 bg-green-600 hover:bg-green-500 text-black font-black rounded-xl transition-all hover:scale-105 active:scale-95">
        Submit Binary
      </button>
    </div>
  );
};

// Level 3: Binary -> Character
const Level3 = ({ onCorrect, onWrong, hints, hintIndex, setHintIndex }) => {
  const [char, setChar] = useState(() => UPPER[Math.floor(Math.random() * 26)]);
  const [revealed, setRevealed] = useState(false);
  const [opts, setOpts] = useState([]);

  useEffect(() => {
    const wrong = shuffle(UPPER.filter(c => c !== char)).slice(0, 3);
    setOpts(shuffle([char, ...wrong]));
    setRevealed(false);
    hints.current = [
      "Look at the active bits: 64 + ...?",
      `The decimal sum is ${toAscii(char)}.`,
      `${toAscii(char)} corresponds to which letter in the alphabet?`
    ];
    setHintIndex(0);
  }, [char, hints, setHintIndex]);

  const bin = toBin8(toAscii(char));

  const handle = (opt) => {
    if (opt === char) {
      setRevealed(true);
      onCorrect();
      setTimeout(() => setChar(UPPER[Math.floor(Math.random() * 26)]), 1500);
    } else onWrong();
  };

  return (
    <div className="text-center w-full">
      <h3 className="text-lg font-bold text-gray-400 mb-6 font-mono">Who is hiding inside this binary?</h3>
      <div className="bg-[#0e0e0e] border border-gray-700 rounded-2xl p-6 mb-8 max-w-sm mx-auto min-h-[140px] flex flex-col justify-center">
        <div className={`text-4xl text-green-400 tracking-[0.2em] font-mono transition-transform duration-500 ${revealed ? '-translate-y-2 scale-90 opacity-50' : ''}`} style={{ textShadow: '0 0 15px rgba(74,222,128,0.5)' }}>
          {bin}
        </div>
        {revealed && (
          <div className="animate-fade-in-up mt-2 flex flex-col items-center">
            <span className="text-yellow-400 font-mono mb-1 text-sm">{toAscii(char)}</span>
            <span className="text-5xl font-black text-white">{char}</span>
          </div>
        )}
      </div>
      <div className="flex gap-4 justify-center flex-wrap max-w-xs mx-auto">
        {opts.map((opt, i) => (
          <button key={i} onClick={() => handle(opt)} disabled={revealed} className="w-16 h-16 bg-[#0e0e0e] hover:bg-gray-800 border-2 border-gray-700 hover:border-green-500 text-white font-black text-2xl rounded-xl transition-all hover:scale-110 active:scale-95 disabled:opacity-50 disabled:hover:scale-100">
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
};

// Level 4: Character -> Binary
const Level4 = ({ onCorrect, onWrong, hints, hintIndex, setHintIndex }) => {
  const [char, setChar] = useState(() => UPPER[Math.floor(Math.random() * 26)]);
  const [step, setStep] = useState(1); // 1: input ASCII, 2: input Binary
  const [asciiInput, setAsciiInput] = useState('');
  const [binInput, setBinInput] = useState('');

  const targetAscii = toAscii(char);
  const targetBin = toBin8(targetAscii);

  useEffect(() => {
    hints.current = step === 1 
      ? ["Remember A=65.", `Count up from A. ${char} is number ${targetAscii}.`]
      : ["Binary uses powers of 2 (128, 64, 32...)", `Which powers of 2 sum to ${targetAscii}?`, `The binary is ${targetBin}`];
    setHintIndex(0);
  }, [char, step, hints, setHintIndex, targetAscii, targetBin]);

  const checkAscii = () => {
    if (parseInt(asciiInput) === targetAscii) {
      setStep(2);
      onCorrect(); // partial correct
    } else onWrong();
  };

  const checkBin = () => {
    if (binInput === targetBin) {
      onCorrect();
      setTimeout(() => {
        setChar(UPPER[Math.floor(Math.random() * 26)]);
        setStep(1);
        setAsciiInput('');
        setBinInput('');
      }, 1500);
    } else onWrong();
  };

  return (
    <div className="text-center w-full">
      <div className="text-6xl font-black text-cyan-400 mb-8">{char}</div>
      
      {step === 1 && (
        <div className="animate-fade-in flex flex-col items-center">
          <p className="text-gray-400 mb-4 font-mono">Step 1: What is the ASCII number?</p>
          <div className="flex gap-2">
            <input type="number" value={asciiInput} onChange={e => setAsciiInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && checkAscii()} className="w-24 bg-[#0e0e0e] text-white text-center font-mono text-2xl p-3 border-2 border-gray-700 rounded-xl focus:border-cyan-500 outline-none" placeholder="?" />
            <button onClick={checkAscii} className="px-6 bg-cyan-600 hover:bg-cyan-500 rounded-xl font-bold text-white"><ChevronRight /></button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="animate-fade-in flex flex-col items-center">
          <p className="text-yellow-400 mb-4 font-mono font-bold">ASCII: {targetAscii}</p>
          <p className="text-gray-400 mb-4 font-mono">Step 2: Write it in 8-bit binary</p>
          <div className="flex flex-col gap-4 items-center">
            <input type="text" maxLength={8} value={binInput} onChange={e => setBinInput(e.target.value.replace(/[^01]/g, ''))} onKeyDown={e => e.key === 'Enter' && checkBin()} className="w-48 bg-[#0e0e0e] text-green-400 tracking-[0.3em] text-center font-mono text-2xl p-3 border-2 border-gray-700 rounded-xl focus:border-green-500 outline-none" placeholder="00000000" />
            <button onClick={checkBin} className="px-8 py-3 bg-green-600 hover:bg-green-500 rounded-xl font-bold text-black flex items-center gap-2"><Check className="w-5 h-5"/> Verify</button>
          </div>
        </div>
      )}
    </div>
  );
};

// Level 5: Build a Word
const Level5 = ({ onCorrect, onWrong, hints, hintIndex, setHintIndex }) => {
  const [word, setWord] = useState(() => getRand(WORDS));
  const [inputs, setInputs] = useState({});
  const chars = word.split('');

  useEffect(() => {
    hints.current = [
      "Decode each block separately. First block = 1st letter.",
      `The first letter is ${chars[0]}.`,
      `The word starts with ${word.slice(0, 2)}...`
    ];
    setHintIndex(0);
  }, [word, hints, setHintIndex, chars]);

  const handleInput = (i, val) => {
    setInputs(prev => ({ ...prev, [i]: val.toUpperCase().slice(0, 1) }));
  };

  const check = () => {
    const isWin = chars.every((c, i) => inputs[i] === c);
    if (isWin) {
      onCorrect();
      setTimeout(() => {
        setWord(getRand(WORDS));
        setInputs({});
      }, 1500);
    } else onWrong();
  };

  return (
    <div className="text-center w-full">
      <h3 className="text-lg font-bold text-gray-400 mb-6 font-mono">Decode the Word</h3>
      <div className="flex flex-wrap justify-center gap-3 md:gap-6 mb-8 max-w-2xl mx-auto">
        {chars.map((c, i) => (
          <div key={i} className="flex flex-col gap-2 items-center">
            <div className="text-xs sm:text-sm font-mono text-green-400 bg-[#0e0e0e] px-2 py-1 rounded border border-gray-800">{toBin8(toAscii(c))}</div>
            <span className="text-gray-600">↓</span>
            <input type="text" maxLength={1} value={inputs[i] || ''} onChange={e => handleInput(i, e.target.value)} className="w-10 h-12 sm:w-14 sm:h-16 bg-[#0e0e0e] border-2 border-gray-700 rounded-lg text-center font-black text-2xl text-white focus:border-cyan-500 outline-none uppercase" />
          </div>
        ))}
      </div>
      <button onClick={check} className="px-8 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-black rounded-xl transition-all hover:scale-105 active:scale-95">
        Unlock Word
      </button>
    </div>
  );
};

// Level 6: Secret Robot Message
const Level6 = ({ onCorrect, onWrong, hints, hintIndex, setHintIndex }) => {
  const [msg, setMsg] = useState(() => getRand(MESSAGES));
  const [input, setInput] = useState('');
  const binMsg = msg.split('').map(c => c === ' ' ? ' ' : toBin8(toAscii(c))).join(' ');

  useEffect(() => {
    hints.current = [
      "Convert binary to decimal, then to ASCII letters.",
      `The first letter is ${msg[0]}.`,
      `The message is ${msg.length} characters long.`
    ];
    setHintIndex(0);
  }, [msg, hints, setHintIndex]);

  const check = () => {
    if (input.toUpperCase() === msg) {
      onCorrect();
      setTimeout(() => {
        setMsg(getRand(MESSAGES));
        setInput('');
      }, 2000);
    } else onWrong();
  };

  return (
    <div className="text-center w-full">
      <h3 className="text-lg font-bold text-gray-400 mb-6 font-mono">Secret Robot Message</h3>
      <div className="bg-[#0e0e0e] border border-gray-700 rounded-xl p-4 sm:p-6 mb-8 max-w-xl mx-auto break-words font-mono text-green-400 text-sm sm:text-lg tracking-widest leading-loose" style={{ textShadow: '0 0 10px rgba(34,197,94,0.3)' }}>
        {binMsg}
      </div>
      <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
        <input type="text" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && check()} placeholder="Decoded message..." className="flex-1 bg-[#0e0e0e] text-white font-mono text-xl p-3 border-2 border-gray-700 rounded-xl focus:border-green-500 outline-none text-center uppercase" />
        <button onClick={check} className="px-6 py-3 bg-green-600 hover:bg-green-500 text-black font-black rounded-xl transition-all hover:scale-105 active:scale-95 whitespace-nowrap">
          Decode
        </button>
      </div>
    </div>
  );
};

// ─── MAIN GAME ───────────────────────────────────────────────────────────────
const GAME_LEVELS = [
  { id: 1, title: 'Guess the Letter', icon: '🔤', desc: 'Convert ASCII number to a letter.' },
  { id: 2, title: 'Build the Binary', icon: '⚡', desc: 'Flip 8 switches to make binary.' },
  { id: 3, title: 'Binary → Character', icon: '👀', desc: 'Who is hiding inside the binary?' },
  { id: 4, title: 'Character → Binary', icon: '🔄', desc: 'Reverse! Letter → Decimal → Binary.' },
  { id: 5, title: 'Build a Word', icon: '🧩', desc: 'Decode blocks into a human word.' },
  { id: 6, title: 'Secret Message', icon: '🔐', desc: 'Decode the full robot transmission.' }
];

const RANKS = [
  { name: 'Letter Rookie', min: 0 },
  { name: 'ASCII Explorer', min: 100 },
  { name: 'Binary Builder', min: 300 },
  { name: 'Code Decoder', min: 600 },
  { name: 'Robot Master', min: 1000 }
];

export default function RobotGame({ addXp, recordAnswer }) {
  const [level, setLevel] = useState(null);
  const [xp, setXp] = useState(() => Number(localStorage.getItem('robot_game_xp') || 0));
  const [combo, setCombo] = useState(0);
  const [robotMood, setRobotMood] = useState('normal');
  const [robotSpeaking, setRobotSpeaking] = useState(false);
  const [feedback, setFeedback] = useState(null);
  
  const hintsRef = useRef([]);
  const [hintIndex, setHintIndex] = useState(0);
  const startTimeRef = useRef(Date.now());
  const timerRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('robot_game_xp', xp.toString());
  }, [xp]);

  useEffect(() => {
    if (level) {
      startTimeRef.current = Date.now();
      setHintIndex(0);
      setFeedback(null);
    }
  }, [level]);

  const showFeedback = (msg, isCorrect) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setFeedback({ msg, isCorrect });
    timerRef.current = setTimeout(() => setFeedback(null), 2500);
  };

  const handleCorrect = useCallback(() => {
    const timeTaken = (Date.now() - startTimeRef.current) / 1000;
    const fastBonus = timeTaken < 3 ? 5 : 0;
    const newCombo = combo + 1;
    setCombo(newCombo);
    
    let comboBonus = 0;
    if (newCombo >= 10) comboBonus = 20;
    else if (newCombo >= 5) comboBonus = 10;
    else if (newCombo >= 3) comboBonus = 5;

    const totalEarned = 10 + fastBonus + comboBonus;
    setXp(x => x + totalEarned);
    addXp?.(totalEarned);
    recordAnswer?.(true);
    
    setRobotMood('happy');
    setRobotSpeaking(true);
    setTimeout(() => { setRobotMood('normal'); setRobotSpeaking(false); }, 1000);
    
    let msg = getRand(CORRECT_MSGS);
    if (fastBonus) msg += " (Speed Bonus! ⚡)";
    if (comboBonus) msg += ` (${newCombo}x Combo! 🔥)`;
    showFeedback(msg, true);
    
    startTimeRef.current = Date.now();
    setHintIndex(0);
  }, [combo, addXp, recordAnswer]);

  const handleWrong = useCallback(() => {
    setCombo(0);
    recordAnswer?.(false);
    setRobotMood('sad');
    setTimeout(() => setRobotMood('normal'), 1000);
    showFeedback(getRand(WRONG_MSGS), false);
  }, [recordAnswer]);

  const revealHint = () => {
    if (hintIndex < hintsRef.current.length) {
      setHintIndex(i => i + 1);
      // small XP penalty for hints could go here
    }
  };

  const rank = RANKS.slice().reverse().find(r => xp >= r.min) || RANKS[0];

  const renderLevel = () => {
    const props = { onCorrect: handleCorrect, onWrong: handleWrong, hints: hintsRef, hintIndex, setHintIndex };
    switch (level) {
      case 1: return <Level1 {...props} />;
      case 2: return <Level2 {...props} />;
      case 3: return <Level3 {...props} />;
      case 4: return <Level4 {...props} />;
      case 5: return <Level5 {...props} />;
      case 6: return <Level6 {...props} />;
      default: return null;
    }
  };

  // MENU
  if (!level) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row gap-8 items-center bg-[#0e0e0e] border border-green-500/30 rounded-3xl p-8 mb-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/5 rounded-full blur-3xl pointer-events-none"></div>
          <div className="shrink-0 flex flex-col items-center">
            <Robot mood="happy" speaking={true} />
            <div className="mt-4 bg-gray-900 border border-gray-700 rounded-xl px-4 py-2 text-center shadow-lg">
              <p className="text-yellow-400 font-bold text-sm">Rank: {rank.name}</p>
              <p className="text-gray-400 text-xs font-mono">{xp} XP</p>
            </div>
          </div>
          <div className="flex-1 text-center md:text-left z-10">
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">Binary Character Lab</h2>
            <p className="text-xl text-green-400 font-bold mb-4">Teach a Robot How Humans Write!</p>
            <p className="text-gray-400 text-lg leading-relaxed mb-6">
              "🤖 BEEP BOOP! I understand 0 and 1... but humans keep sending me LETTERS! Can you teach me how to turn letters into numbers, and numbers into binary?"
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {GAME_LEVELS.map((lvl, idx) => {
            const isLocked = idx > 0 && xp < (idx * 50); // Simple progressive lock: 0, 50, 100, 150...
            return (
              <button key={lvl.id} onClick={() => !isLocked && setLevel(lvl.id)} disabled={isLocked} className={`group text-left p-6 rounded-2xl border-2 transition-all duration-300 relative overflow-hidden
                ${isLocked ? 'bg-gray-900/50 border-gray-800 opacity-70 cursor-not-allowed' : 'bg-[#0e0e0e] border-gray-800 hover:border-green-500/50 hover:bg-gray-900 hover:-translate-y-1'}`}>
                {isLocked && <div className="absolute top-4 right-4 text-gray-600"><Lock className="w-5 h-5"/></div>}
                <div className="text-4xl mb-4">{lvl.icon}</div>
                <h3 className={`text-xl font-bold mb-2 ${isLocked ? 'text-gray-500' : 'text-white group-hover:text-green-400'}`}>Level {lvl.id}: {lvl.title}</h3>
                <p className="text-sm text-gray-500">{lvl.desc}</p>
                {isLocked && <p className="text-xs text-yellow-600 font-mono mt-3">Unlocks at {idx * 50} XP</p>}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // GAME PLAY
  const lvlInfo = GAME_LEVELS.find(l => l.id === level);
  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-[#0e0e0e] border border-gray-800 p-4 rounded-2xl">
        <button onClick={() => setLevel(null)} className="text-gray-400 hover:text-white transition-colors text-sm font-bold flex items-center gap-1">
          ← Level Select
        </button>
        <div className="flex items-center gap-2 font-bold text-white text-lg">
          <span className="text-2xl">{lvlInfo.icon}</span> Level {level}: {lvlInfo.title}
        </div>
        <div className="flex items-center gap-4">
          <div className="text-yellow-400 font-mono font-bold flex items-center gap-1"><Star className="w-4 h-4 fill-current"/> {xp} XP</div>
          {combo > 1 && <div className="text-orange-400 font-mono font-bold flex items-center gap-1 animate-pulse"><Zap className="w-4 h-4 fill-current"/> {combo}x</div>}
        </div>
      </div>

      {/* Main Area */}
      <div className="flex flex-col lg:flex-row gap-6 items-stretch">
        <div className="lg:w-64 shrink-0 bg-[#0e0e0e] border border-gray-800 rounded-2xl p-6 flex flex-col items-center justify-center">
          <Robot mood={robotMood} speaking={robotSpeaking} />
          <FeedbackBubble msg={feedback?.msg} isCorrect={feedback?.isCorrect} />
        </div>
        <div className="flex-1 bg-[#0e0e0e] border border-gray-800 rounded-2xl p-6 md:p-10 flex flex-col justify-center min-h-[400px]">
          {renderLevel()}
          <HintSystem hints={hintsRef.current} hintIndex={hintIndex} onRevealHint={revealHint} />
        </div>
      </div>
    </div>
  );
}
