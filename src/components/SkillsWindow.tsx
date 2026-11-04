import React, { useState } from 'react';
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
  Info,
} from 'lucide-react';

interface SkillsWindowProps {
  stats: PlayerStats;
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'all' | 'weapons' | 'origins' | 'elements' | 'defense';

export default function SkillsWindow({ stats, isOpen, onClose }: SkillsWindowProps) {
  const [activeTab, setActiveTab] = useState<TabType>('all');

  if (!isOpen) return null;

  const aptitudes = CLASS_APTITUDES[stats.classType];
  const isAvenger = stats.classType === 'Avenger';

  const getAptitudeBadge = (multiplier: number) => {
    if (multiplier <= 1.0) {
      return (
        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-950/80 border border-emerald-600/60 text-emerald-300 font-bold">
          1.0x Favored
        </span>
      );
    }
    if (multiplier <= 1.5) {
      return (
        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-blue-950/80 border border-blue-600/60 text-blue-300">
          {multiplier.toFixed(1)}x Standard
        </span>
      );
    }
    if (multiplier <= 2.5) {
      return (
        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-amber-950/80 border border-amber-600/60 text-amber-300">
          {multiplier.toFixed(1)}x Difficult
        </span>
      );
    }
    return (
      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-red-950/80 border border-red-600/60 text-red-300">
        {multiplier.toFixed(1)}x Alien
      </span>
    );
  };

  const weaponMeta: Record<WeaponFamily, { label: string; reach: string; desc: string }> = {
    flexible: {
      label: 'Flexible (Whips / Flails)',
      reach: '2-Tile Reach',
      desc: isAvenger ? 'Primary Avenger weapon family' : 'Alternative control weapons',
    },
    sidearms: {
      label: 'Sidearms (Wands / Guns)',
      reach: '4-Tile Reach',
      desc: !isAvenger ? 'Primary Sage weapon family' : 'Long range arcane focus',
    },
    blades: {
      label: 'Blades (Swords / Daggers)',
      reach: '1-Tile Reach',
      desc: 'Close combat high dexterity melee',
    },
  };

  const originMeta: Record<MagicOrigin, { label: string; color: string; desc: string }> = {
    radiant: { label: 'Radiant', color: '#facc15', desc: 'Solar warmth, holy light & restoration' },
    arcane: { label: 'Arcane', color: '#60a5fa', desc: 'Pure planar energy, kinetic force & telekinesis' },
    eldritch: { label: 'Eldritch', color: '#c084fc', desc: 'Void mysteries, mindbending entropy & shadows' },
    wild: { label: 'Wild', color: '#4ade80', desc: 'Primal instincts, flora, beast & nature vigor' },
  };

  const elementMeta: Record<ElementSchool, { label: string; color: string; desc: string }> = {
    air: { label: 'Air', color: '#38bdf8', desc: 'Gale currents, tempest strikes & lightning' },
    fire: { label: 'Fire', color: '#f87171', desc: 'Blazing cinder, pyromancy & ignition' },
    water: { label: 'Water', color: '#60a5fa', desc: 'Glacial frost, torrents & fluid grace' },
    earth: { label: 'Earth', color: '#ca8a04', desc: 'Granite tremors, roots & botanical vines' },
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
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-[#12151f] border-2 border-[#544638] rounded-lg shadow-2xl flex flex-col overflow-hidden text-zinc-100 font-sans">
        {/* Retro Header Strip */}
        <div className="bg-[#1b202e] border-b border-[#3b3226] px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="text-sm sm:text-base font-bold font-mono tracking-wider text-amber-200 uppercase">
                Skills & Aptitudes (Tibia System)
              </h2>
              <p className="text-[11px] text-zinc-400 font-mono">
                {stats.classType} Class · Train skills by usage
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-[#2c344a] text-zinc-400 hover:text-white transition-colors cursor-pointer"
            title="Close (Esc / K)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Filters */}
        <div className="flex items-center gap-1 px-4 py-2 bg-[#171b28] border-b border-[#293043] overflow-x-auto text-xs font-mono">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
              activeTab === 'all'
                ? 'bg-amber-600 text-stone-950 font-bold'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#22283a]'
            }`}
          >
            All Skills
          </button>
          <button
            onClick={() => setActiveTab('weapons')}
            className={`px-2.5 py-1 rounded transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'weapons'
                ? 'bg-amber-600 text-stone-950 font-bold'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#22283a]'
            }`}
          >
            <Swords className="w-3.5 h-3.5" /> Weapons
          </button>
          <button
            onClick={() => setActiveTab('origins')}
            className={`px-2.5 py-1 rounded transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'origins'
                ? 'bg-amber-600 text-stone-950 font-bold'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#22283a]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" /> Origins
          </button>
          <button
            onClick={() => setActiveTab('elements')}
            className={`px-2.5 py-1 rounded transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'elements'
                ? 'bg-amber-600 text-stone-950 font-bold'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#22283a]'
            }`}
          >
            <Flame className="w-3.5 h-3.5" /> Elements
          </button>
          <button
            onClick={() => setActiveTab('defense')}
            className={`px-2.5 py-1 rounded transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'defense'
                ? 'bg-amber-600 text-stone-950 font-bold'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#22283a]'
            }`}
          >
            <Shield className="w-3.5 h-3.5" /> Defense
          </button>
        </div>

        {/* Scrollable Skills Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {/* Section: Weapon Families */}
          {(activeTab === 'all' || activeTab === 'weapons') && (
            <div className="space-y-2">
              <div className="flex items-center justify-between border-b border-[#293043] pb-1">
                <span className="text-xs font-mono font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Swords className="w-4 h-4 text-amber-400" /> Weapon Proficiencies (Hits Landed)
                </span>
                <span className="text-[11px] font-mono text-zinc-400">
                  Bonus: +Math.floor(Level * 0.75) dmg
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {(['flexible', 'sidearms', 'blades'] as WeaponFamily[]).map((wf) => {
                  const skill = stats.skills?.weapons?.[wf] || {
                    level: 10,
                    hits: 0,
                    hitsToNextLevel: 100,
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
                      className="bg-[#181d2a] border border-[#2f384f] rounded p-2.5 space-y-1.5 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-mono text-xs font-bold text-zinc-200">
                            {formatSkillName(wf)}
                          </span>
                          <span className="font-mono text-xs font-bold text-amber-400">
                            Lv {skill.level}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-1 text-[11px] text-zinc-400 mb-1.5">
                          <span className="text-[10px] text-zinc-400">{info.reach}</span>
                          {getAptitudeBadge(mult)}
                        </div>
                        <div className="text-[10px] text-zinc-400 line-clamp-1">
                          {info.desc}
                        </div>
                      </div>

                      <div className="space-y-1 pt-1 border-t border-[#23293a]">
                        <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400">
                          <span>
                            {skill.hits} / {skill.hitsToNextLevel} hits
                          </span>
                          <span className="text-amber-300">+{bonus} dmg</span>
                        </div>
                        <div className="w-full bg-[#0d0f17] h-2 rounded-full overflow-hidden border border-[#273044]">
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
              <div className="flex items-center justify-between border-b border-[#293043] pb-1">
                <span className="text-xs font-mono font-bold text-sky-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-sky-400" /> Magic Origins (Mana Spent)
                </span>
                <span className="text-[11px] font-mono text-zinc-400">
                  Bonus: +Math.floor(Level * 0.8) spell dmg
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {(['radiant', 'arcane', 'wild', 'eldritch'] as MagicOrigin[]).map((mo) => {
                  const skill = stats.skills?.origins?.[mo] || {
                    level: 0,
                    manaSpent: 0,
                    manaToNextLevel: 60,
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
                      className="bg-[#181d2a] border border-[#2f384f] rounded p-2.5 space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="w-2.5 h-2.5 rounded-full inline-block"
                            style={{ backgroundColor: info.color }}
                          />
                          <span className="font-mono text-xs font-bold text-zinc-200">
                            {info.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {getAptitudeBadge(mult)}
                          <span className="font-mono text-xs font-bold text-sky-300">
                            Lv {skill.level}
                          </span>
                        </div>
                      </div>
                      <p className="text-[10px] text-zinc-400">{info.desc}</p>
                      <div className="space-y-1 pt-1 border-t border-[#23293a]">
                        <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400">
                          <span>
                            {skill.manaSpent} / {skill.manaToNextLevel} MP
                          </span>
                          <span className="text-sky-300">{pct}%</span>
                        </div>
                        <div className="w-full bg-[#0d0f17] h-2 rounded-full overflow-hidden border border-[#273044]">
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
              <div className="flex items-center justify-between border-b border-[#293043] pb-1">
                <span className="text-xs font-mono font-bold text-red-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-red-400" /> Elements (Mana Spent)
                </span>
                <span className="text-[11px] font-mono text-zinc-400">
                  Bonus: +Math.floor(Level * 0.8) spell dmg
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {(['air', 'fire', 'earth', 'water'] as ElementSchool[]).map((el) => {
                  const skill = stats.skills?.elements?.[el] || {
                    level: 0,
                    manaSpent: 0,
                    manaToNextLevel: 60,
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
                      className="bg-[#181d2a] border border-[#2f384f] rounded p-2.5 space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="w-2.5 h-2.5 rounded-full inline-block"
                            style={{ backgroundColor: info.color }}
                          />
                          <span className="font-mono text-xs font-bold text-zinc-200">
                            {info.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {getAptitudeBadge(mult)}
                          <span className="font-mono text-xs font-bold text-red-300">
                            Lv {skill.level}
                          </span>
                        </div>
                      </div>
                      <p className="text-[10px] text-zinc-400">{info.desc}</p>
                      <div className="space-y-1 pt-1 border-t border-[#23293a]">
                        <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400">
                          <span>
                            {skill.manaSpent} / {skill.manaToNextLevel} MP
                          </span>
                          <span className="text-red-300">{pct}%</span>
                        </div>
                        <div className="w-full bg-[#0d0f17] h-2 rounded-full overflow-hidden border border-[#273044]">
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
              <div className="flex items-center justify-between border-b border-[#293043] pb-1">
                <span className="text-xs font-mono font-bold text-lime-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-lime-400" /> Defense & Armor (Hits Taken)
                </span>
                <span className="text-[11px] font-mono text-zinc-400">
                  Increases with monster attacks
                </span>
              </div>

              {(() => {
                const defSkill = stats.skills?.defense || {
                  level: 10,
                  hitsTaken: 0,
                  hitsToNextLevel: 40,
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
                  <div className="bg-[#181d2a] border border-[#2f384f] rounded p-2.5 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Shield className="w-4 h-4 text-lime-400" />
                        <span className="font-mono text-xs font-bold text-zinc-200">
                          Shielding & Physical Resilience
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {getAptitudeBadge(mult)}
                        <span className="font-mono text-xs font-bold text-lime-300">
                          Lv {defSkill.level}
                        </span>
                      </div>
                    </div>
                    <p className="text-[10px] text-zinc-400">
                      Advances as enemies strike your hero in combat.
                    </p>
                    <div className="space-y-1 pt-1 border-t border-[#23293a]">
                      <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400">
                        <span>
                          {defSkill.hitsTaken || 0} / {defSkill.hitsToNextLevel} hits taken
                        </span>
                        <span className="text-lime-300">{pct}%</span>
                      </div>
                      <div className="w-full bg-[#0d0f17] h-2 rounded-full overflow-hidden border border-[#273044]">
                        <div
                          className="bg-lime-500 h-full transition-all duration-300 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Current Active Bonuses Summary Card */}
          <div className="bg-[#10131c] border border-[#3b3226] p-3 rounded text-xs font-mono space-y-2">
            <div className="flex items-center gap-1.5 text-amber-300 font-bold">
              <Zap className="w-4 h-4" /> Active Skill Bonuses for {stats.classType}:
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-zinc-300">
              <div className="bg-[#171b26] p-2 rounded border border-[#262e40]">
                <div className="text-zinc-400">Weapon Swing Bonus:</div>
                <div className="text-amber-400 font-bold">+{weaponBonus} Damage</div>
              </div>
              <div className="bg-[#171b26] p-2 rounded border border-[#262e40]">
                <div className="text-zinc-400">
                  {isAvenger ? 'Entangling Lash (Rad/Ear):' : 'Aether Gale Shot (Arc/Air):'}
                </div>
                <div className="text-sky-300 font-bold">+{spell1Bonus} Spell Dmg</div>
              </div>
              <div className="bg-[#171b26] p-2 rounded border border-[#262e40]">
                <div className="text-zinc-400">
                  {isAvenger ? 'Cinder Brand (Rad/Fir):' : 'Static Confusion (Arc/Air):'}
                </div>
                <div className="text-red-300 font-bold">
                  +{spell2Bonus} {isAvenger ? 'Dmg & Heal' : 'Spell Dmg'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer controls */}
        <div className="bg-[#171b28] border-t border-[#293043] px-4 py-2.5 flex items-center justify-between text-xs font-mono text-zinc-400">
          <span>Press [K] or click [X] to close</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold rounded cursor-pointer transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
