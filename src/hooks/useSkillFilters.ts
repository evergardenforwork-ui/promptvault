import { useState, useMemo } from 'react';
import { SkillPackage, User, SKILL_TYPE_OPTIONS, TARGET_AI_OPTIONS } from '../types';

export function useSkillFilters(skills: SkillPackage[], user: User | null) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSkillTypes, setSelectedSkillTypes] = useState<string[]>([]);
  const [selectedTargetAi, setSelectedTargetAi] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'my-own' | 'my-web' | 'others'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'name'>('date');

  const filteredSkills = useMemo(() => {
    return skills.filter((skill) => {
      // 1. Поиск по тексту
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = skill.title.toLowerCase().includes(q);
        const matchesDesc = skill.description?.toLowerCase().includes(q) ?? false;
        const matchesTag = skill.tags?.some((t) => t.toLowerCase().includes(q)) ?? false;
        const matchesCategory = skill.category?.toLowerCase().includes(q) ?? false;
        if (!matchesTitle && !matchesDesc && !matchesTag && !matchesCategory) {
          return false;
        }
      }

      // 2. Источник (Ownership)
      if (sourceFilter === 'my-own') {
        if (skill.userId !== user?.uid || skill.skillOrigin === 'web') return false;
      } else if (sourceFilter === 'my-web') {
        if (skill.userId !== user?.uid || skill.skillOrigin !== 'web') return false;
      } else if (sourceFilter === 'others') {
        if (skill.userId === user?.uid) return false;
      }

      // 3. Тип скилла (AND логика: должны присутствовать все выбранные типы)
      if (selectedSkillTypes.length > 0) {
        if (!skill.skillTypes) return false;
        for (const reqType of selectedSkillTypes) {
          if (!skill.skillTypes.includes(reqType)) return false;
        }
      }

      // 4. Целевой ИИ / Платформа
      if (selectedTargetAi !== 'all') {
        if (!skill.targetAis || !skill.targetAis.includes(selectedTargetAi)) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'name') {
        return a.title.localeCompare(b.title, 'ru');
      } else {
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      }
    });
  }, [skills, searchQuery, selectedSkillTypes, selectedTargetAi, sourceFilter, sortBy, user]);

  const counts = useMemo(() => {
    const all = skills.length;
    const own = skills.filter((s) => s.userId === user?.uid && s.skillOrigin !== 'web').length;
    const web = skills.filter((s) => s.userId === user?.uid && s.skillOrigin === 'web').length;
    const others = skills.filter((s) => s.userId !== user?.uid).length;
    return { all, own, web, others };
  }, [skills, user]);

  // Счётчики по типам скилла
  const skillTypeCounts = useMemo(() => {
    const res: Record<string, number> = { all: skills.length };
    SKILL_TYPE_OPTIONS.forEach((opt) => {
      res[opt.value] = skills.filter((s) => s.skillTypes?.includes(opt.value)).length;
    });
    return res;
  }, [skills]);

  // Счётчики по целевым ИИ
  const targetAiCounts = useMemo(() => {
    const res: Record<string, number> = { all: skills.length };
    TARGET_AI_OPTIONS.forEach((opt) => {
      res[opt.value] = skills.filter((s) => s.targetAis?.includes(opt.value)).length;
    });
    return res;
  }, [skills]);

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedSkillTypes([]);
    setSelectedTargetAi('all');
    setSourceFilter('all');
  };

  const isFiltered = searchQuery !== '' || selectedSkillTypes.length > 0 || selectedTargetAi !== 'all' || sourceFilter !== 'all';

  return {
    searchQuery,
    setSearchQuery,
    selectedSkillTypes,
    setSelectedSkillTypes,
    selectedTargetAi,
    setSelectedTargetAi,
    sourceFilter,
    setSourceFilter,
    sortBy,
    setSortBy,
    filteredSkills,
    counts,
    skillTypeCounts,
    targetAiCounts,
    resetFilters,
    isFiltered,
  };
}
