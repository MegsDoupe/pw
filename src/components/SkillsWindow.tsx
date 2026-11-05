import React, { useState, useEffect } from 'react';
import {
  CharacterClass,
  ElementSchool,
  MagicOrigin,
  PlayerStats,
  WeaponFamily,
} from '../types/game';
import {
  CLASS_APTITUDES,
  formatSkillName,
  getSpellSkillBonus,
  getWeaponSkillDamageBonus,
} from '../game/leveling';
import {
  X,
  Swords,
  Sparkles,
  Flame,
  Shield,
  Zap,
  BookOpen,
} from 'lucide-react';

interface SkillsWindowProps {
  stats: PlayerStats;
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'all' | 'weapons' | 'origins' | 'elements' | 'defense';

export default function SkillsWindow({ stats, isOpen, onClose }: SkillsWindowProps) {
  const [activeTab, setActiveTab] = useState<TabType>('all');

  // Escape key handler to close drawer
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const aptitudes = CLASS_APTITUDES[stats.classType];
  const isAvenger = stats.classType === 'Avenger';

  const getAptitudeBadge = (multiplier: number) => {
    if (multiplier <= 1.0) {
      return (
        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-emerald-950/80 border border-emerald-600/60 text-emerald-300 font-bold whitespace-nowrap">
          1.0x Favored
        </span>
      );
    }
    if (multiplier <= 1.5) {
      return (
        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-blue-950/80 border border-blue-600/60 text-blue-300 whitespace-nowrap">
          {multiplier.toFixed(1)}x Standard
        </span>
      );
    }
    if (multiplier <= 2.5) {
      return (
        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-amber-950/80 border border-amber-600/60 text-amber-300 whitespace-nowrap">
          {multiplier.toFixed(1)}x Difficult
        </span>
      );
    }
    return (
      <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-red-950/80 border border-red-600/60 text-red-300 whitespace-nowrap">
        {multiplier.toFixed(1)}x Alien
      </span>
    );
  };

  const weaponMeta: Record<WeaponFamily, { label: string; reach: string; desc: string }> = {
    flexible: {
      label: 'Flexible (Whips / Flails)',
      reach: '2-Tile Reach',
      desc: isAvenger ? 'Primary Avenger weapon' : 'Control whip family',
    },
    sidearms: {
      label: 'Sidearms (Wands / Guns)',
      reach: '4-Tile Reach',
      desc: !isAvenger ? 'Primary Sage weapon' : 'Ranged arcane focus',
    },
    blades: {
      label: 'Blades (Swords / Daggers)',
      reach: '1-Tile Reach',
      desc: 'Close combat dexterity melee',
    },
  };

  const originMeta: Record<MagicOrigin, { label: string; color: string; desc: string }> = {
    radiant: { label: 'Radiant', color: '#facc15', desc: 'Solar warmth & holy light' },
    arcane: { label: 'Arcane', color: '#60a5fa', desc: 'Planar force & telekinesis' },
    eldritch: { label: 'Eldritch', color: '#c084fc', desc: 'Void mysteries & entropy' },
    wild: { label: 'Wild', color: '#4ade80', desc: 'Primal beast & flora vigor' },
  };

  const elementMeta: Record<ElementSchool, { label: string; color: string; desc: string }> = {
    air: { label: 'Air', color: '#38bdf8', desc: 'Gale currents & tempest' },
    fire: { label: 'Fire', color: '#f87171', desc: 'Pyromancy & cinder ignition' },
    water: { label: 'Water', color: '#60a5fa', desc: 'Glacial frost & torrents' },
    earth: { label: 'Earth', color: '#ca8a04', desc: 'Granite tremors & vines' },
  };

  // Active calculated bonuses
  const weaponBonus = getWeaponSkillDamageBonus(stats, isAvenger ? 'flexible' : 'sidearms');
  const spell1Bonus = isAvenger
    ? getSpellSkillBonus(stats, 'radiant', 'earth')
    : getSpellSkillBonus(stats, 'arcane', 'air');
  const spell2Bonus = isAvenger
    ? getSpellSkillBonus(stats, 'radiant', 'fire')
    : getSpellSkillBonus(stats, 'arcane', 'air');

  return (
    <>
      {/* Mobile Backdrop Overlay (Click to dismiss on smaller screens) */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-xs transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Slide-Out Right Drawer Container */}
      <aside
        className={`fixed top-0 right-0 bottom-0 z-50 w-full sm:w-[320px] max-w-[90vw] bg-[#14100c] border-l-2 border-[#54412c] shadow-[0_0_40px_rgba(0,0,0,0.95)] flex flex-col font-mono text-zinc-100 transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Drawer Header Strip */}
        <div className="bg-[#1e1712] border-b-2 border-[#432d1d] px-3.5 py-3 flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-amber-400" />
            <div>
              <h2 className="text-xs sm:text-sm font-bold font-mono tracking-wider text-amber-200 uppercase">
                Skills & Aptitudes
              </h2>
              <p className="text-[10px] text-zinc-400 font-mono">
                {stats.classType} Class · Train by Doing
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-[#342418] text-zinc-400 hover:text-white transition-colors cursor-pointer border border-transparent hover:border-[#523820]"
            title="Close Drawer [Esc]"
            aria-label="Close Skills Drawer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Filters (Clean Segmented Controls) */}
        <div className="flex items-center gap-1 px-3 py-2 bg-[#18120e] border-b border-[#312216] overflow-x-auto text-[11px] font-mono shrink-0">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-2 py-1 rounded transition-colors cursor-pointer ${
              activeTab === 'all'
                ? 'bg-amber-600 text-stone-950 font-bold'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#251b14]'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setActiveTab('weapons')}
            className={`px-2 py-1 rounded transition-colors cursor-pointer flex items-center gap-1 ${
              activeTab === 'weapons'
                ? 'bg-amber-600 text-stone-950 font-bold'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#251b14]'
            }`}
          >
            <Swords className="w-3 h-3" /> Weapons
          </button>
          <button
            onClick={() => setActiveTab('origins')}
            className={`px-2 py-1 rounded transition-colors cursor-pointer flex items-center gap-1 ${
              activeTab === 'origins'
                ? 'bg-amber-600 text-stone-950 font-bold'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#251b14]'
            }`}
          >
            <Sparkles className="w-3 h-3" /> Origins
          </button>
          <button
            onClick={() => setActiveTab('elements')}
            className={`px-2 py-1 rounded transition-colors cursor-pointer flex items-center gap-1 ${
              activeTab === 'elements'
                ? 'bg-amber-600 text-stone-950 font-bold'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#251b14]'
            }`}
          >
            <Flame className="w-3 h-3" /> Elements
          </button>
          <button
            onClick={() => setActiveTab('defense')}
            className={`px-2 py-1 rounded transition-colors cursor-pointer flex items-center gap-1 ${
              activeTab === 'defense'
                ? 'bg-amber-600 text-stone-950 font-bold'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#251b14]'
            }`}
          >
            <Shield className="w-3 h-3" /> Defense
          </button>
        </div>

        {/* Scrollable Skills Content */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {/* Section: Weapon Families */}
          {(activeTab === 'all' || activeTab === 'weapons') && (
            <div className="space-y-2">
              <div className="flex items-center justify-between border-b border-[#312216] pb-1">
                <span className="text-[11px] font-mono font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1">
                  <Swords className="w-3.5 h-3.5 text-amber-400" /> Weapons (Hits)
                </span>
                <span className="text-[10px] text-zinc-400">
                  +⌊Lv*0.75⌋ dmg
                </span>
              </div>

              <div className="space-y-2">
                {(['flexible', 'sidearms', 'blades'] as WeaponFamily[]).map((wf) => {
                  const skill = stats.skills?.weapons?.[wf] || {
                    level: 10,
                    hits: 0,
                    hitsToNextLevel: 20,
                  };
                  const mult = aptitudes.weapons[wf];
                  const info = weaponMeta[wf];
                  const pct = Math.min(
                    100,
                    Math.max(0, Math.floor((skill.hits / (skill.hitsToNextLevel || 1)) * 100))
                  );
                  const bonus = Math.floor(skill.level * 0.75);

                  return (
                    <div
                      key={wf}
                      className="bg-[#1c1510] border border-[#3d2a1c] rounded p-2 space-y-1 shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-zinc-200">
                          {formatSkillName(wf)}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {getAptitudeBadge(mult)}
                          <span className="font-mono text-xs font-bold text-amber-400">
                            Lv {skill.level}
                          </span>
                        </div>
                      </div>
                      <div className="text-[10px] text-zinc-400 flex items-center justify-between">
                        <span>{info.reach}</span>
                        <span className="text-amber-300">+{bonus} dmg</span>
                      </div>
                      <div className="space-y-0.5 pt-1 border-t border-[#291c13]">
                        <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400">
                          <span>
                            {skill.hits} / {skill.hitsToNextLevel} Hits
                          </span>
                          <span className="text-amber-300">{pct}%</span>
                        </div>
                        <div className="w-full bg-[#0d0907] h-2 rounded-full overflow-hidden border border-[#2b1b11]">
                          <div
                            className="bg-amber-500 h-full transition-all duration-300 rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Section: Magic Origins */}
          {(activeTab === 'all' || activeTab === 'origins') && (
            <div className="space-y-2">
              <div className="flex items-center justify-between border-b border-[#312216] pb-1">
                <span className="text-[11px] font-mono font-bold text-sky-300 uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-sky-400" /> Origins (Mana)
                </span>
                <span className="text-[10px] text-zinc-400">
                  +⌊Lv*0.8⌋ spell dmg
                </span>
              </div>

              <div className="space-y-2">
                {(['radiant', 'arcane', 'wild', 'eldritch'] as MagicOrigin[]).map((mo) => {
                  const skill = stats.skills?.origins?.[mo] || {
                    level: 10,
                    manaSpent: 0,
                    manaToNextLevel: 40,
                  };
                  const mult = aptitudes.origins[mo];
                  const info = originMeta[mo];
                  const pct = Math.min(
                    100,
                    Math.max(
                      0,
                      Math.floor((skill.manaSpent / (skill.manaToNextLevel || 1)) * 100)
                    )
                  );

                  return (
                    <div
                      key={mo}
                      className="bg-[#1c1510] border border-[#3d2a1c] rounded p-2 space-y-1 shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="w-2 h-2 rounded-full inline-block"
                            style={{ backgroundColor: info.color }}
                          />
                          <span className="font-mono text-xs font-bold text-zinc-200">
                            {info.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {getAptitudeBadge(mult)}
                          <span className="font-mono text-xs font-bold text-sky-300">
                            Lv {skill.level}
                          </span>
                        </div>
                      </div>
                      <p className="text-[9px] text-zinc-400">{info.desc}</p>
                      <div className="space-y-0.5 pt-1 border-t border-[#291c13]">
                        <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400">
                          <span>
                            {skill.manaSpent} / {skill.manaToNextLevel} MP
                          </span>
                          <span className="text-sky-300">{pct}%</span>
                        </div>
                        <div className="w-full bg-[#0d0907] h-2 rounded-full overflow-hidden border border-[#2b1b11]">
                          <div
                            className="bg-sky-500 h-full transition-all duration-300 rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Section: Elements */}
          {(activeTab === 'all' || activeTab === 'elements') && (
            <div className="space-y-2">
              <div className="flex items-center justify-between border-b border-[#312216] pb-1">
                <span className="text-[11px] font-mono font-bold text-red-300 uppercase tracking-wider flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-red-400" /> Elements (Mana)
                </span>
                <span className="text-[10px] text-zinc-400">
                  +⌊Lv*0.8⌋ spell dmg
                </span>
              </div>

              <div className="space-y-2">
                {(['air', 'fire', 'earth', 'water'] as ElementSchool[]).map((el) => {
                  const skill = stats.skills?.elements?.[el] || {
                    level: 10,
                    manaSpent: 0,
                    manaToNextLevel: 40,
                  };
                  const mult = aptitudes.elements[el];
                  const info = elementMeta[el];
                  const pct = Math.min(
                    100,
                    Math.max(
                      0,
                      Math.floor((skill.manaSpent / (skill.manaToNextLevel || 1)) * 100)
                    )
                  );

                  return (
                    <div
                      key={el}
                      className="bg-[#1c1510] border border-[#3d2a1c] rounded p-2 space-y-1 shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="w-2 h-2 rounded-full inline-block"
                            style={{ backgroundColor: info.color }}
                          />
                          <span className="font-mono text-xs font-bold text-zinc-200">
                            {info.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {getAptitudeBadge(mult)}
                          <span className="font-mono text-xs font-bold text-red-300">
                            Lv {skill.level}
                          </span>
                        </div>
                      </div>
                      <p className="text-[9px] text-zinc-400">{info.desc}</p>
                      <div className="space-y-0.5 pt-1 border-t border-[#291c13]">
                        <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400">
                          <span>
                            {skill.manaSpent} / {skill.manaToNextLevel} MP
                          </span>
                          <span className="text-red-300">{pct}%</span>
                        </div>
                        <div className="w-full bg-[#0d0907] h-2 rounded-full overflow-hidden border border-[#2b1b11]">
                          <div
                            className="bg-red-500 h-full transition-all duration-300 rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Section: Defense */}
          {(activeTab === 'all' || activeTab === 'defense') && (
            <div className="space-y-2">
              <div className="flex items-center justify-between border-b border-[#312216] pb-1">
                <span className="text-[11px] font-mono font-bold text-lime-300 uppercase tracking-wider flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5 text-lime-400" /> Defense (Hits Taken)
                </span>
              </div>

              {(() => {
                const defSkill = stats.skills?.defense || {
                  level: 10,
                  hitsTaken: 0,
                  hitsToNextLevel: 15,
                };
                const mult = aptitudes.defense;
                const pct = Math.min(
                  100,
                  Math.max(
                    0,
                    Math.floor(
                      ((defSkill.hitsTaken || 0) / (defSkill.hitsToNextLevel || 1)) * 100
                    )
                  )
                );

                return (
                  <div className="bg-[#1c1510] border border-[#3d2a1c] rounded p-2 space-y-1 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-zinc-200">
                        Shielding & Resilience
                      </span>
                      <div className="flex items-center gap-1.5">
                        {getAptitudeBadge(mult)}
                        <span className="font-mono text-xs font-bold text-lime-300">
                          Lv {defSkill.level}
                        </span>
                      </div>
                    </div>
                    <p className="text-[9px] text-zinc-400">
                      Advances on physical evasions and blocks.
                    </p>
                    <div className="space-y-0.5 pt-1 border-t border-[#291c13]">
                      <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400">
                        <span>
                          {defSkill.hitsTaken || 0} / {defSkill.hitsToNextLevel} Hits
                        </span>
                        <span className="text-lime-300">{pct}%</span>
                      </div>
                      <div className="w-full bg-[#0d0907] h-2 rounded-full overflow-hidden border border-[#2b1b11]">
                        <div
                          className="bg-lime-500 h-full transition-all duration-300 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>

                    {/* Defense Attributes: Armor Soak & Shield Block */}
                    <div className="grid grid-cols-2 gap-1.5 pt-1.5 text-[10px] font-mono border-t border-[#24170f]">
                      <div className="bg-[#140e09] px-2 py-1 rounded border border-[#2b1b11]">
                        <span className="text-zinc-500 block text-[9px]">Armor Soak</span>
                        <span className="text-amber-300 font-bold">-{stats.armor ?? (isAvenger ? 2 : 1)} Dmg</span>
                      </div>
                      <div className="bg-[#140e09] px-2 py-1 rounded border border-[#2b1b11]">
                        <span className="text-zinc-500 block text-[9px]">Shield Block</span>
                        <span className="text-sky-300 font-bold">Up to {Math.floor((defSkill.level ?? 10) * 0.8 + 2)} Dmg</span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Elemental & Origin Resistances Profile */}
              <div className="bg-[#18110b] border border-[#3b2718] p-2 rounded text-[10px] font-mono space-y-1.5 shadow-sm">
                <div className="flex items-center justify-between text-zinc-300 font-bold border-b border-[#291b11] pb-1">
                  <span className="flex items-center gap-1 text-sky-300">
                    <Shield className="w-3 h-3 text-sky-400" /> Resistances
                  </span>
                  <span className="text-[9px] text-zinc-500">Dual-Axis Matrix</span>
                </div>
                <div className="grid grid-cols-2 gap-1 text-[9px]">
                  <div className="space-y-0.5">
                    <span className="text-zinc-500 block font-bold text-[8px] uppercase">Origins</span>
                    {Object.entries(stats.resistances?.origins ?? (isAvenger ? { radiant: 0.25, wild: 0.1, arcane: 0, eldritch: -0.15 } : { arcane: 0.25, eldritch: 0.1, radiant: 0, wild: -0.15 })).map(([orig, val]) => (
                      <div key={orig} className="flex justify-between text-zinc-400">
                        <span className="capitalize">{orig}:</span>
                        <span className={val > 0 ? 'text-emerald-400 font-bold' : val < 0 ? 'text-rose-400 font-bold' : 'text-zinc-500'}>
                          {val > 0 ? `+${Math.round(val * 100)}%` : val < 0 ? `${Math.round(val * 100)}%` : '0%'}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-zinc-500 block font-bold text-[8px] uppercase">Elements</span>
                    {Object.entries(stats.resistances?.elements ?? (isAvenger ? { fire: 0.25, earth: 0.1, air: 0, water: -0.15 } : { air: 0.25, water: 0.1, earth: 0, fire: -0.15 })).map(([elem, val]) => (
                      <div key={elem} className="flex justify-between text-zinc-400">
                        <span className="capitalize">{elem}:</span>
                        <span className={val > 0 ? 'text-emerald-400 font-bold' : val < 0 ? 'text-rose-400 font-bold' : 'text-zinc-500'}>
                          {val > 0 ? `+${Math.round(val * 100)}%` : val < 0 ? `${Math.round(val * 100)}%` : '0%'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Active Skill Bonuses Summary Card */}
          <div className="bg-[#18110b] border border-[#432d1d] p-2.5 rounded text-[11px] font-mono space-y-1.5 shadow-inner">
            <div className="flex items-center gap-1 text-amber-300 font-bold">
              <Zap className="w-3.5 h-3.5" /> Active Bonuses:
            </div>
            <div className="space-y-1 text-zinc-300 text-[10px]">
              <div className="flex items-center justify-between bg-[#1f1610] px-2 py-1 rounded">
                <span className="text-zinc-400">Weapon Swing:</span>
                <span className="text-amber-400 font-bold">+{weaponBonus} Dmg</span>
              </div>
              <div className="flex items-center justify-between bg-[#1f1610] px-2 py-1 rounded">
                <span className="text-zinc-400">Slot 1 Spell:</span>
                <span className="text-sky-300 font-bold">+{spell1Bonus} Dmg</span>
              </div>
              <div className="flex items-center justify-between bg-[#1f1610] px-2 py-1 rounded">
                <span className="text-zinc-400">Slot 2 Spell:</span>
                <span className="text-red-300 font-bold">+{spell2Bonus} Dmg</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-[#18120e] border-t border-[#312216] px-3.5 py-2.5 flex items-center justify-between text-[10px] font-mono text-zinc-400 shrink-0">
          <span>Press [K] or [Esc] to close</span>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold rounded cursor-pointer transition-colors"
          >
            Close
          </button>
        </div>
      </aside>
    </>
  );
}
