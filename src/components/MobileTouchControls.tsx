import React, { useState } from 'react';
import { Direction } from '../types/game';
import { Crosshair } from 'lucide-react';

export interface MobileTouchControlsProps {
  onDpadDirection: (dir: Direction) => void;
  onCycleTarget: () => void;
  onActionPress: () => void;
  visible: boolean;
}

export default function MobileTouchControls({
  onDpadDirection,
  onCycleTarget,
  onActionPress,
  visible,
}: MobileTouchControlsProps) {
  const [activeDirection, setActiveDirection] = useState<Direction>('NONE');

  if (!visible) return null;

  const handleDpadPress = (dir: Direction) => {
    setActiveDirection(dir);
    onDpadDirection(dir);
  };

  const handleDpadRelease = () => {
    setActiveDirection('NONE');
    onDpadDirection('NONE');
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-20 flex items-end justify-between p-3 sm:p-5 select-none font-mono">
      {/* Bottom-Left: Virtual 8-Direction Touch D-Pad */}
      <div className="pointer-events-auto bg-[#140f0b]/80 border-2 border-[#523b26] p-1.5 rounded-lg shadow-2xl backdrop-blur-xs">
        <div className="grid grid-cols-3 gap-1 w-24 h-24 sm:w-28 sm:h-28">
          <button
            type="button"
            onPointerDown={() => handleDpadPress('UP_LEFT')}
            onPointerUp={handleDpadRelease}
            onPointerLeave={handleDpadRelease}
            className={`flex items-center justify-center text-[10px] rounded border transition-colors cursor-pointer ${
              activeDirection === 'UP_LEFT'
                ? 'bg-amber-600 text-black border-amber-300 font-bold'
                : 'bg-[#1e1712]/90 text-zinc-400 border-[#38271a]'
            }`}
            aria-label="Up-Left"
          >
            ↖
          </button>
          <button
            type="button"
            onPointerDown={() => handleDpadPress('UP')}
            onPointerUp={handleDpadRelease}
            onPointerLeave={handleDpadRelease}
            className={`flex items-center justify-center font-bold text-sm rounded border transition-colors cursor-pointer ${
              activeDirection === 'UP'
                ? 'bg-amber-600 text-black border-amber-300'
                : 'bg-[#291e17]/95 text-amber-200 border-[#4a3422]'
            }`}
            aria-label="Up"
          >
            ▲
          </button>
          <button
            type="button"
            onPointerDown={() => handleDpadPress('UP_RIGHT')}
            onPointerUp={handleDpadRelease}
            onPointerLeave={handleDpadRelease}
            className={`flex items-center justify-center text-[10px] rounded border transition-colors cursor-pointer ${
              activeDirection === 'UP_RIGHT'
                ? 'bg-amber-600 text-black border-amber-300 font-bold'
                : 'bg-[#1e1712]/90 text-zinc-400 border-[#38271a]'
            }`}
            aria-label="Up-Right"
          >
            ↗
          </button>
          <button
            type="button"
            onPointerDown={() => handleDpadPress('LEFT')}
            onPointerUp={handleDpadRelease}
            onPointerLeave={handleDpadRelease}
            className={`flex items-center justify-center font-bold text-sm rounded border transition-colors cursor-pointer ${
              activeDirection === 'LEFT'
                ? 'bg-amber-600 text-black border-amber-300'
                : 'bg-[#291e17]/95 text-amber-200 border-[#4a3422]'
            }`}
            aria-label="Left"
          >
            ◀
          </button>
          <div className="flex items-center justify-center bg-[#18110c] rounded text-[10px] text-zinc-600">
            •
          </div>
          <button
            type="button"
            onPointerDown={() => handleDpadPress('RIGHT')}
            onPointerUp={handleDpadRelease}
            onPointerLeave={handleDpadRelease}
            className={`flex items-center justify-center font-bold text-sm rounded border transition-colors cursor-pointer ${
              activeDirection === 'RIGHT'
                ? 'bg-amber-600 text-black border-amber-300'
                : 'bg-[#291e17]/95 text-amber-200 border-[#4a3422]'
            }`}
            aria-label="Right"
          >
            ▶
          </button>
          <button
            type="button"
            onPointerDown={() => handleDpadPress('DOWN_LEFT')}
            onPointerUp={handleDpadRelease}
            onPointerLeave={handleDpadRelease}
            className={`flex items-center justify-center text-[10px] rounded border transition-colors cursor-pointer ${
              activeDirection === 'DOWN_LEFT'
                ? 'bg-amber-600 text-black border-amber-300 font-bold'
                : 'bg-[#1e1712]/90 text-zinc-400 border-[#38271a]'
            }`}
            aria-label="Down-Left"
          >
            ↙
          </button>
          <button
            type="button"
            onPointerDown={() => handleDpadPress('DOWN')}
            onPointerUp={handleDpadRelease}
            onPointerLeave={handleDpadRelease}
            className={`flex items-center justify-center font-bold text-sm rounded border transition-colors cursor-pointer ${
              activeDirection === 'DOWN'
                ? 'bg-amber-600 text-black border-amber-300'
                : 'bg-[#291e17]/95 text-amber-200 border-[#4a3422]'
            }`}
            aria-label="Down"
          >
            ▼
          </button>
          <button
            type="button"
            onPointerDown={() => handleDpadPress('DOWN_RIGHT')}
            onPointerUp={handleDpadRelease}
            onPointerLeave={handleDpadRelease}
            className={`flex items-center justify-center text-[10px] rounded border transition-colors cursor-pointer ${
              activeDirection === 'DOWN_RIGHT'
                ? 'bg-amber-600 text-black border-amber-300 font-bold'
                : 'bg-[#1e1712]/90 text-zinc-400 border-[#38271a]'
            }`}
            aria-label="Down-Right"
          >
            ↘
          </button>
        </div>
      </div>

      {/* Bottom-Right: Quick Target Nearest & Action Buttons */}
      <div className="pointer-events-auto flex flex-col items-center gap-3">
        {/* Quick Target Button */}
        <button
          type="button"
          onClick={onCycleTarget}
          className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-red-800 to-rose-950 border-2 border-red-400 text-amber-100 font-bold text-[10px] shadow-2xl flex flex-col items-center justify-center cursor-pointer active:scale-95 transition-transform"
          title="Target Nearest Monster [Tab]"
          aria-label="Target Nearest"
        >
          <Crosshair className="w-5 h-5 text-red-300" />
          <span className="text-[8px] font-mono leading-none">TAB</span>
        </button>

        {/* Action / Primary Spell Button */}
        <button
          type="button"
          onClick={onActionPress}
          className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-amber-600 via-amber-700 to-yellow-700 border-2 border-amber-300 text-stone-950 font-black text-xs shadow-2xl flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
          aria-label="Action / Primary Ability"
        >
          ACT
        </button>
      </div>
    </div>
  );
}
