import React, { useEffect, useRef } from 'react';

const BinaryBackground = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let animFrameId;
    let width, height, columns, drops, speeds;

    const fontSize = 15;
    const chars = '01';

    const resize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      columns = Math.floor(width / fontSize);
      drops = Array(columns).fill(0).map(() => Math.random() * -(height / fontSize));
      // Each column gets a slightly different speed for organic feel
      speeds = Array(columns).fill(0).map(() => 0.15 + Math.random() * 0.2);
    };

    resize();
    window.addEventListener('resize', resize);

    const draw = () => {
      // Slower fade = digits stay bright longer → more contrast
      ctx.fillStyle = 'rgba(0, 0, 0, 0.04)';
      ctx.fillRect(0, 0, width, height);

      drops.forEach((y, i) => {
        const char = chars[Math.floor(Math.random() * chars.length)];
        const x = i * fontSize;

        // First digit = blazing white-green head with strong glow
        ctx.font = `bold ${fontSize}px monospace`;
        ctx.shadowBlur = 18;
        ctx.shadowColor = '#00ff88';
        ctx.fillStyle = '#e0ffe8';
        ctx.fillText(char, x, y * fontSize);

        // Second digit just below the head = bright cyan
        ctx.fillStyle = '#00ffcc';
        ctx.shadowBlur = 12;
        ctx.fillText(
          chars[Math.floor(Math.random() * chars.length)],
          x,
          (y - 1) * fontSize
        );

        // Trail: vivid green that fades gradually
        const trailLength = 18;
        for (let t = 2; t < trailLength; t++) {
          const alpha = Math.max(0, 1 - t / trailLength);
          const green = Math.floor(180 + (1 - alpha) * 60); // 180→240 green channel
          ctx.fillStyle = `rgba(0, ${green}, 80, ${alpha * 0.9})`;
          ctx.shadowBlur = 0;
          ctx.fillText(
            chars[Math.floor(Math.random() * chars.length)],
            x,
            (y - t) * fontSize
          );
        }

        // Reset column randomly when off screen
        if (y * fontSize > height && Math.random() > 0.972) {
          drops[i] = 0;
        }
        drops[i] += speeds[i];
      });

      animFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animFrameId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
        opacity: 0.55,
      }}
      aria-hidden="true"
    />
  );
};

export default BinaryBackground;

