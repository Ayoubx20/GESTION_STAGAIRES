import React from 'react';

const PremiumToggle = ({ checked, onChange, labelLeft = 'Off', labelRight = 'On' }) => {
  return (
    <div className="flex items-center justify-center py-2 px-1">
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className="relative w-28 h-12 rounded-full outline-none bg-[#f0f3f8] dark:bg-[#1a1b1f] shadow-[inset_4px_4px_8px_rgba(180,186,196,0.6),inset_-4px_-4px_8px_rgba(255,255,255,0.9)] dark:shadow-[inset_4px_4px_8px_rgba(0,0,0,0.8),inset_-4px_-4px_8px_rgba(30,32,36,0.8)] flex items-center transition-colors duration-300"
      >
        <span className="sr-only">Toggle</span>

        {/* Labels underneath the track */}
        <div className="absolute inset-0 flex items-center justify-between px-5 pointer-events-none font-sans font-medium text-xs tracking-wider z-0">
          <span className={`transition-all duration-300 transform ${!checked ? 'text-[#8b919e] scale-100 opacity-100' : 'text-transparent scale-90 opacity-0'}`}>{labelLeft}</span>
          <span className={`transition-all duration-300 transform ${checked ? 'text-[#e56755] scale-100 opacity-100' : 'text-transparent scale-90 opacity-0'}`}>{labelRight}</span>
        </div>

        {/* The Track Fill (Liquid transition from left to right) */}
        <div 
          className={`absolute left-1 top-1 bottom-1 rounded-full transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] flex items-center justify-end z-10 ${
            checked ? 'w-[calc(100%-8px)]' : 'w-10'
          }`}
        >
            {/* Stretching Gradient Body */}
            {checked && (
                <div className="absolute left-0 right-8 h-full rounded-l-full bg-gradient-to-r from-[#ffe0c4] via-[#ffaf7b] to-[#f06e5e] shadow-[inset_0px_2px_4px_rgba(255,255,255,0.4),inset_0px_-2px_4px_rgba(0,0,0,0.1)] opacity-100 animate-fade-in-up"></div>
            )}

            {/* The Solid Thumb */}
            <div className={`relative w-10 h-10 rounded-[100%] transition-colors duration-500 flex items-center justify-center transform scale-110 
              ${checked 
                ? 'bg-gradient-to-br from-[#ffd9b3] via-[#fb8c66] to-[#d85040] shadow-[6px_0px_12px_rgba(216,80,64,0.5),-2px_0_5px_rgba(255,255,255,0.8),inset_2px_4px_8px_rgba(255,255,255,0.8),inset_-2px_-5px_10px_rgba(0,0,0,0.2)]' 
                : 'bg-gradient-to-br from-[#f8f9fb] to-[#d9dee6] dark:from-[#3a3b3f] dark:to-[#1a1b1f] shadow-[3px_3px_8px_rgba(180,186,196,0.6),-3px_-3px_8px_rgba(255,255,255,0.9),inset_2px_4px_8px_rgba(255,255,255,0.8),inset_-2px_-5px_10px_rgba(0,0,0,0.05)] dark:shadow-[3px_3px_8px_rgba(0,0,0,0.6),-3px_-3px_8px_rgba(50,52,56,0.4),inset_2px_4px_8px_rgba(255,255,255,0.1)]'
              }`}
            >
               {/* Glossy Top Reflection */}
               <div className="absolute top-[2px] left-[15%] w-[70%] h-[35%] bg-gradient-to-b from-white/90 to-transparent rounded-t-full transform -rotate-6"></div>
               <div className="absolute bottom-[2px] right-[10%] w-[40%] h-[20%] bg-gradient-to-t from-white/30 to-transparent rounded-[100%] transform rotate-12"></div>
            </div>
        </div>
      </button>
    </div>
  );
};
export default PremiumToggle;
