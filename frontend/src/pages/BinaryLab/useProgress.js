import { useState, useEffect } from 'react';

const LEVELS = [
  { name: 'Binary Beginner', minXp: 0 },
  { name: 'Bit Manipulator', minXp: 100 },
  { name: 'Byte Explorer', minXp: 300 },
  { name: 'ASCII Master', minXp: 600 },
  { name: 'Binary Wizard', minXp: 1000 }
];

const ACHIEVEMENTS_LIST = [
  { id: 'first_binary', title: 'First Binary', desc: 'Convert your first number' },
  { id: 'perfect_10', title: 'Perfect 10/10', desc: 'Score 100% on a quiz' },
  { id: 'streak_7', title: '7-Day Streak', desc: 'Play for 7 consecutive days' },
  { id: 'ascii_master', title: 'ASCII Master', desc: 'Decode 5 characters' },
  { id: 'speedrunner', title: 'Speedrunner', desc: 'Score > 10 in speed challenge' }
];

export const useProgress = () => {
  const [progress, setProgress] = useState(() => {
    const saved = localStorage.getItem('binary_lab_progress');
    if (saved) {
      return JSON.parse(saved);
    }
    return {
      xp: 0,
      streak: 1,
      lastPlayedDate: new Date().toISOString().split('T')[0],
      achievements: [],
      accuracyTotal: { correct: 0, total: 0 },
      bestSpeedScore: 0
    };
  });

  useEffect(() => {
    // Check streak
    const today = new Date().toISOString().split('T')[0];
    const lastPlayed = new Date(progress.lastPlayedDate);
    const todayDate = new Date(today);
    const diffTime = Math.abs(todayDate - lastPlayed);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let newStreak = progress.streak;
    if (diffDays === 1) {
      newStreak += 1;
    } else if (diffDays > 1) {
      newStreak = 1;
    }

    if (diffDays >= 1) {
      setProgress(p => ({ ...p, streak: newStreak, lastPlayedDate: today }));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('binary_lab_progress', JSON.stringify(progress));
    
    // Check 7 day streak achievement
    if (progress.streak >= 7 && !progress.achievements.includes('streak_7')) {
      unlockAchievement('streak_7');
    }
  }, [progress]);

  const addXp = (amount) => {
    setProgress(p => ({ ...p, xp: p.xp + amount }));
  };

  const recordAnswer = (isCorrect) => {
    setProgress(p => ({
      ...p,
      accuracyTotal: {
        correct: p.accuracyTotal.correct + (isCorrect ? 1 : 0),
        total: p.accuracyTotal.total + 1
      }
    }));
  };

  const updateBestSpeedScore = (score) => {
    if (score > progress.bestSpeedScore) {
      setProgress(p => ({ ...p, bestSpeedScore: score }));
      if (score > 10) unlockAchievement('speedrunner');
    }
  };

  const unlockAchievement = (id) => {
    if (!progress.achievements.includes(id)) {
      setProgress(p => ({ ...p, achievements: [...p.achievements, id] }));
      // Could trigger a toast here
    }
  };

  const getCurrentLevel = () => {
    let current = LEVELS[0];
    let next = LEVELS[1];
    
    for (let i = 0; i < LEVELS.length; i++) {
      if (progress.xp >= LEVELS[i].minXp) {
        current = LEVELS[i];
        next = LEVELS[i + 1] || null;
      }
    }
    
    return { current, next };
  };

  return {
    progress,
    addXp,
    recordAnswer,
    updateBestSpeedScore,
    unlockAchievement,
    getCurrentLevel,
    ACHIEVEMENTS_LIST
  };
};
