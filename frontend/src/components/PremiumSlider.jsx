import React, { useState, useRef, useEffect } from 'react';
// ana hna
const PremiumSlider = ({ value = 48, onChange, min = 0, max = 100 }) => {
  const [internalValue, setInternalValue] = useState(value);
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef(null);

  const displayValue = onChange ? value : internalValue;

  const handleMove = (clientX) => {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percentage = (x / rect.width);
    const newValue = Math.round(min + percentage * (max - min));

    setInternalValue(newValue);
    if (onChange) onChange(newValue);
  };

  useEffect(() => {
    const onMouseMove = (e) => isDragging && handleMove(e.clientX);
    const onMouseUp = () => setIsDragging(false);
    const onTouchMove = (e) => isDragging && handleMove(e.touches[0].clientX);

    if (isDragging) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
      window.addEventListener('touchmove', onTouchMove, { passive: false });
      window.addEventListener('touchend', onMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onMouseUp);
    };
  }, [isDragging]);

  const percentage = Math.max(12, ((displayValue - min) / (max - min)) * 100);

  return (
    <div className="flex flex-col items-center justify-center p-8 w-full max-w-md mx-auto my-6 animate-fade-in-up">
      <div className="text-sm font-semibold text-gray-400 mb-6 tracking-widest uppercase">Premium Liquid Slider Demo</div>
      {/* Outer plaque to give a solid base for Neumorphism regardless of site theme */}
      <div className="w-full bg-[#f0f3f8] dark:bg-[#1a1b1f] p-8 rounded-[3rem] shadow-[15px_15px_30px_rgba(180,186,196,0.5),-15px_-15px_30px_rgba(255,255,255,0.8)] dark:shadow-[15px_15px_30px_rgba(0,0,0,0.6),-15px_-15px_30px_rgba(255,255,255,0.03)] border-2 border-white/50 dark:border-white/5 relative z-10 transition-colors duration-500 hover:scale-[1.01]">

        {/* Realistic Inner Track cut-out */}
        <div
          ref={sliderRef}
          onMouseDown={(e) => { setIsDragging(true); handleMove(e.clientX); }}
          onTouchStart={(e) => { setIsDragging(true); handleMove(e.touches[0].clientX); }}
          className="relative w-full h-16 rounded-full bg-[#e6eaf0] dark:bg-[#141518] shadow-[inset_6px_6px_12px_rgba(180,186,196,0.6),inset_-6px_-6px_12px_rgba(255,255,255,0.9),inset_0px_0px_3px_rgba(0,0,0,0.1)] dark:shadow-[inset_8px_8px_16px_rgba(0,0,0,0.8),inset_-8px_-8px_16px_rgba(30,32,36,0.8)] cursor-pointer flex items-center select-none"
        >
          {/* Embossed Text */}
          <div className="absolute right-6 text-[#9a9fae] dark:text-[#4a4f5e] font-sans font-light text-2xl tracking-tighter pointer-events-none drop-shadow-sm select-none mix-blend-multiply dark:mix-blend-screen transition-all">
            {displayValue}%
          </div>

          {/* Liquid thumb/bar stretching */}
          <div
            className="absolute left-0 h-full flex items-center justify-end pointer-events-none transition-all duration-75 ease-out"
            style={{ width: `${percentage}%` }}
          >
            {/* Stretched liquid bar */}
            <div className="absolute left-1 right-12 h-[75%] rounded-l-full bg-gradient-to-r from-[#ffe0c4] via-[#ffaf7b] to-[#f06e5e] shadow-[inset_0px_4px_8px_rgba(255,255,255,0.4),inset_0px_-2px_4px_rgba(0,0,0,0.15),0_6px_15px_-3px_rgba(240,110,94,0.3)]"></div>

            {/* Bulbous thumb head on the right */}
            <div className="relative w-20 h-20 -mr-6 rounded-full bg-gradient-to-br from-[#ffd9b3] via-[#fb8c66] to-[#d85040] shadow-[10px_0px_20px_rgba(216,80,64,0.4),-5px_0px_10px_rgba(255,255,255,0.6),inset_2px_4px_8px_rgba(255,255,255,0.8),inset_-2px_-5px_10px_rgba(0,0,0,0.2)] dark:shadow-[10px_0px_20px_rgba(216,80,64,0.2),-5px_0px_10px_rgba(0,0,0,0.4),inset_2px_4px_8px_rgba(255,255,255,0.3),inset_-2px_-5px_10px_rgba(0,0,0,0.4)] flex items-center justify-center z-20 overflow-hidden transform transition-transform duration-200">

              {/* Extremely glossy upper reflection */}
              <div className="absolute top-1 left-2 w-12 h-6 bg-gradient-to-b from-white/90 to-transparent rounded-[100%] transform -rotate-12 blur-[0.5px]"></div>

              {/* Secondary edge gloss */}
              <div className="absolute bottom-1 right-2 w-8 h-4 bg-gradient-to-t from-white/40 to-transparent rounded-[100%] transform rotate-[30deg]"></div>

              {/* Core color depth */}
              <div className="absolute inset-2 rounded-full border border-white/20 shadow-[inset_0_0_15px_rgba(0,0,0,0.1)]"></div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default PremiumSlider;
