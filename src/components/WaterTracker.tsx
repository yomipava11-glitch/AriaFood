import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Droplet, Plus } from 'lucide-react';

interface WaterTrackerProps {
  currentAmount: number;
  goal: number;
  onAddWater: (amount: number) => void;
}

const WaterTracker: React.FC<WaterTrackerProps> = ({ currentAmount, goal, onAddWater }) => {
  const [isAdding, setIsAdding] = useState(false);
  const percentage = Math.min((currentAmount / goal) * 100, 100);

  const handleAdd = async (amount: number) => {
    setIsAdding(true);
    await onAddWater(amount);
    setIsAdding(false);
  };

  return (
    <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm relative overflow-hidden flex flex-col justify-center min-h-[160px]">
      {/* Background Subtle Wave */}
      <div className="absolute inset-x-0 bottom-0 z-0 opacity-10 pointer-events-none overflow-hidden h-full">
        <motion.div
           className="absolute bottom-0 left-0 right-0 bg-blue-500 rounded-t-[50%]"
           initial={{ height: 0 }}
           animate={{ height: `${percentage}%` }}
           transition={{ type: 'spring', bounce: 0.3, duration: 1.5 }}
           style={{ width: '200%', marginLeft: '-50%' }}
        />
      </div>

      <div className="relative z-10 flex flex-row items-center justify-between gap-4">
        {/* Info */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Droplet className="w-5 h-5 text-blue-500 fill-blue-500" />
            <h3 className="text-sm font-semibold text-gray-700">Hydratation</h3>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-3xl font-bold text-gray-900">{currentAmount}</span>
            <span className="text-sm text-gray-400 font-medium ml-1">/ {goal} ml</span>
          </div>
          <p className="text-xs text-blue-500 mt-2 font-medium bg-blue-50 w-max px-2 py-1 rounded-full">
            💧 Objectif dynamique ajusté
          </p>
        </div>

        {/* Visual Cup & Controls */}
        <div className="flex flex-col items-center gap-3">
          {/* Main Cup */}
          <div className="w-16 h-24 rounded-b-2xl rounded-t-sm bg-gray-50 border-2 border-gray-200 relative overflow-hidden shadow-inner flex items-end justify-center">
             <motion.div
                className="w-full bg-gradient-to-t from-blue-500 to-cyan-300 relative"
                initial={{ height: 0 }}
                animate={{ height: `${percentage}%` }}
                transition={{ type: 'spring', bounce: 0.3, duration: 1 }}
             >
                {/* Surface ripples */}
                <motion.div 
                   className="absolute top-0 left-0 right-0 h-1 bg-white/40"
                   animate={{ opacity: [0.3, 0.7, 0.3] }}
                   transition={{ duration: 2, repeat: Infinity }}
                />
             </motion.div>
             <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                 <span className="text-white font-bold text-xs drop-shadow-md">{Math.round(percentage)}%</span>
             </div>
          </div>
        </div>
      </div>

      {/* Quick Add Buttons */}
      <div className="relative z-10 flex gap-3 mt-4 pt-4 border-t border-gray-100">
        <button 
            onClick={() => handleAdd(250)}
            disabled={isAdding}
            className="flex-1 bg-blue-50 hover:bg-blue-100 py-2.5 flex items-center justify-center gap-2 rounded-xl text-blue-600 text-[13px] font-semibold active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          250 ml
        </button>
        <button 
            onClick={() => handleAdd(500)}
            disabled={isAdding}
            className="flex-1 bg-blue-50 hover:bg-blue-100 py-2.5 flex items-center justify-center gap-2 rounded-xl text-blue-600 text-[13px] font-semibold active:scale-95 transition-all"
        >
          <Droplet className="w-4 h-4" />
          500 ml
        </button>
      </div>

    </div>
  );
};

export default WaterTracker;
