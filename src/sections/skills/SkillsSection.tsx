import React from 'react';
import { LayoutGrid, List, X, Cpu } from 'lucide-react';
import { AnimatePresence } from 'motion/react';
import { SkillPackage, User, SKILL_TYPE_OPTIONS, TARGET_AI_OPTIONS } from '../../types';
import { cn } from '../../utils/cn';
import { useSkillFilters } from '../../hooks/useSkillFilters';
import SkillCard from './SkillCard';

interface SkillsSectionProps {
  skills: SkillPackage[];
  user: User;
  skillFilters: ReturnType<typeof useSkillFilters>;
  viewMode: 'grid' | 'list';
  setViewMode: (v: 'grid' | 'list') => void;
  onViewSkill: (s: SkillPackage) => void;
  onToggleFavorite: (id: string) => void;
}

export default function SkillsSection({
  skills,
  user,
  skillFilters,
  viewMode,
  setViewMode,
  onViewSkill,
  onToggleFavorite,
}: SkillsSectionProps) {
  return (
    <div className="space-y-8">
      {/* Skills Filter Bar */}
      <div className="flex flex-col gap-4 border-b border-zinc-900 pb-4">
        {/* Upper row: Grid/List, Sort, Ownership Tabs, Reset */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            {/* View Mode & Sort */}
            <div className="flex items-center gap-2 shrink-0">
              <button 
                onClick={() => setViewMode('grid')}
                className={cn(
                  "p-2.5 rounded-xl transition-all cursor-pointer",
                  viewMode === 'grid' ? "bg-purple-500 text-white font-bold" : "bg-zinc-100 dark:bg-zinc-900 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
                )}
                title="Сетка"
              >
                <LayoutGrid size={18} />
              </button>
              <button 
                onClick={() => setViewMode('list')}
                className={cn(
                  "p-2.5 rounded-xl transition-all cursor-pointer",
                  viewMode === 'list' ? "bg-purple-500 text-white font-bold" : "bg-zinc-100 dark:bg-zinc-900 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
                )}
                title="Список"
              >
                <List size={18} />
              </button>
              <div className="h-6 w-px bg-zinc-200 dark:bg-zinc-800 mx-1" />
              <select 
                value={skillFilters.sortBy}
                onChange={(e) => skillFilters.setSortBy(e.target.value as any)}
                className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-700 dark:text-zinc-400 focus:outline-none focus:border-purple-500 cursor-pointer"
              >
                <option value="date">Сначала новые</option>
                <option value="name">По алфавиту</option>
              </select>
            </div>

            {/* Ownership Tabs */}
            <div className="flex bg-zinc-100 dark:bg-zinc-900/50 p-1 rounded-2xl border border-zinc-200 dark:border-zinc-800 shrink-0 overflow-x-auto max-w-full">
              {[
                { id: 'all', name: 'Все (+ чужие)', count: skillFilters.counts.all },
                { id: 'my-all', name: 'Все мои', count: skillFilters.counts.myAll },
                { id: 'my-own', name: 'Мои (Авторские)', count: skillFilters.counts.own },
                { id: 'my-web', name: 'Мои (Из сети)', count: skillFilters.counts.web },
                { id: 'others', name: 'Чужие (Публичные)', count: skillFilters.counts.others }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => skillFilters.setSourceFilter(tab.id as any)}
                  className={cn(
                    "px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shrink-0 whitespace-nowrap",
                    skillFilters.sourceFilter === tab.id 
                      ? "bg-purple-500 text-white font-black shadow-md shadow-purple-500/20" 
                      : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-200"
                  )}
                >
                  <span>{tab.name}</span>
                  <span className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded-md font-bold transition-colors",
                    skillFilters.sourceFilter === tab.id
                      ? "bg-white/20 text-white"
                      : "bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-500"
                  )}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="text-sm text-zinc-500 font-medium shrink-0 flex items-center gap-3">
            {skillFilters.isFiltered && (
              <button
                onClick={() => skillFilters.resetFilters()}
                className="flex items-center gap-1 text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-bold transition-colors cursor-pointer"
              >
                Сбросить фильтр <X size={12} />
              </button>
            )}
            <span>Найдено скиллов: <span className="text-zinc-900 dark:text-white font-bold">{skillFilters.filteredSkills.length}</span></span>
          </div>
        </div>

        {/* Lower row: Skill Types & Target AI filters */}
        <div className="flex flex-col gap-3 pt-3 border-t border-zinc-900/60">
          {/* Skill Type Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider shrink-0 mr-1">Тип:</span>
            <button
              onClick={() => skillFilters.setSelectedSkillTypes([])}
              className={cn(
                "px-3 py-1.5 text-xs font-bold rounded-xl border shrink-0 transition-all cursor-pointer flex items-center gap-1",
                skillFilters.selectedSkillTypes.length === 0
                  ? "bg-purple-600 text-white border-purple-500 font-black shadow-md shadow-purple-500/20"
                  : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-zinc-200"
              )}
            >
              <span>Все</span>
              <span className="text-[10px] bg-black/30 px-1.5 py-0.5 rounded-md">{skillFilters.skillTypeCounts.all}</span>
            </button>
            {SKILL_TYPE_OPTIONS.map((opt) => {
              const count = skillFilters.skillTypeCounts[opt.value] || 0;
              const active = skillFilters.selectedSkillTypes.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  onClick={() => skillFilters.setSelectedSkillTypes(
                    active 
                      ? skillFilters.selectedSkillTypes.filter((t) => t !== opt.value)
                      : [...skillFilters.selectedSkillTypes, opt.value]
                  )}
                  className={cn(
                    "px-3 py-1.5 text-xs font-bold rounded-xl border shrink-0 transition-all cursor-pointer flex items-center gap-1.5",
                    active
                      ? "bg-purple-600 text-white border-purple-500 font-black shadow-md shadow-purple-500/20"
                      : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-zinc-200"
                  )}
                >
                  <span>{opt.emoji}</span>
                  <span>{opt.label}</span>
                  {count > 0 && (
                    <span className={cn("text-[10px] px-1.5 py-0.5 rounded-md", active ? "bg-white/20 text-white" : "bg-zinc-800 text-zinc-500")}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Target AI Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
              <Cpu size={13} className="text-sky-400" /> ИИ:
            </span>
            <button
              onClick={() => skillFilters.setSelectedTargetAi('all')}
              className={cn(
                "px-3 py-1.5 text-xs font-bold rounded-xl border shrink-0 transition-all cursor-pointer flex items-center gap-1",
                skillFilters.selectedTargetAi === 'all'
                  ? "bg-sky-500 text-black border-sky-400 font-black shadow-md shadow-sky-400/20"
                  : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-zinc-200"
              )}
            >
              <span>Все</span>
              <span className="text-[10px] bg-black/30 px-1.5 py-0.5 rounded-md">{skillFilters.targetAiCounts.all}</span>
            </button>
            {TARGET_AI_OPTIONS.map((opt) => {
              const count = skillFilters.targetAiCounts[opt.value] || 0;
              const active = skillFilters.selectedTargetAi === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => skillFilters.setSelectedTargetAi(active ? 'all' : opt.value)}
                  className={cn(
                    "px-3 py-1.5 text-xs font-bold rounded-xl border shrink-0 transition-all cursor-pointer flex items-center gap-1.5",
                    active
                      ? "bg-sky-500 text-black border-sky-400 font-black shadow-md shadow-sky-400/20"
                      : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-zinc-200"
                  )}
                >
                  <span>{opt.emoji}</span>
                  <span>{opt.label}</span>
                  {count > 0 && (
                    <span className={cn("text-[10px] px-1.5 py-0.5 rounded-md", active ? "bg-black/25 text-black" : "bg-zinc-800 text-zinc-500")}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Skills Grid */}
      <div className={cn(
        "grid gap-6",
        viewMode === 'grid' ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"
      )}>
        <AnimatePresence mode="popLayout">
          {skillFilters.filteredSkills.map((skill) => (
            <SkillCard
              key={skill.id}
              skill={skill}
              viewMode={viewMode}
              searchQuery={skillFilters.searchQuery}
              onView={() => onViewSkill(skill)}
              onToggleFavorite={() => onToggleFavorite(skill.id)}
              effectiveUser={user}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
