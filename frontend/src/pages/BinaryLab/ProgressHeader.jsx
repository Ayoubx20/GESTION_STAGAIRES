import React from 'react';
import { Trophy, Zap, Target } from 'lucide-react';

const ProgressHeader = ({ progress, getCurrentLevel }) => {
  const { current, next } = getCurrentLevel();
  
  const accuracy = progress.accuracyTotal.total > 0 
    ? Math.round((progress.accuracyTotal.correct / progress.accuracyTotal.total) * 100)
    : 0;
    
  let progressPercentage = 100;
  if (next) {
    const range = next.minXp - current.minXp;
    const currentProgress = progress.xp - current.minXp;
    progressPercentage = Math.max(0, Math.min(100, (currentProgress / range) * 100));
  }

  return (
    <div className="bg-gray-900 rounded-xl p-4 sm:p-6 mb-8 border border-gray-800 shadow-xl flex flex-col md:flex-row gap-6 items-center justify-between transition-all">
      <div className="flex-1 w-full">
        <div className="flex justify-between items-end mb-2">
          <div>
            <p className="text-gray-400 text-sm font-medium mb-1">Current Level</p>
            <h3 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              <Trophy className="w-6 h-6 text-yellow-400" />
              {current.name}
            </h3>
          </div>
          <div className="text-right">
            <span className="text-green-400 font-bold text-lg">{progress.xp} XP</span>
            {next && <span className="text-gray-500 text-sm ml-2">/ {next.minXp} XP</span>}
          </div>
        </div>
        
        {next && (
          <div className="h-4 w-full bg-gray-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-green-500 to-cyan-400 transition-all duration-1000 ease-out"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        )}
      </div>

      <div className="flex gap-4 md:gap-8 w-full md:w-auto justify-around md:justify-end border-t md:border-t-0 md:border-l border-gray-800 pt-4 md:pt-0 md:pl-8">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-orange-400 mb-1">
            <Zap className="w-5 h-5 fill-current" />
            <span className="font-bold text-xl">{progress.streak}</span>
          </div>
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Day Streak</p>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-blue-400 mb-1">
            <Target className="w-5 h-5" />
            <span className="font-bold text-xl">{accuracy}%</span>
          </div>
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Accuracy</p>
        </div>
      </div>
    </div>
  );
};

export default ProgressHeader;
