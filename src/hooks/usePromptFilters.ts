import { useMemo } from 'react';
import { Prompt, User, MediaType } from '../types';

type SortBy = 'date' | 'name' | 'usage';
export type SourceFilter = 'all' | 'my-all' | 'my-own' | 'my-web' | 'others';
type MediaFilter = 'all' | MediaType;

interface UsePromptFiltersOptions {
  prompts: Prompt[];
  user: User | null;
  searchQuery: string;
  selectedCategory: string | null;
  showFavoritesOnly: boolean;
  sourceFilter: SourceFilter;
  mediaFilter: MediaFilter;
  sortBy: SortBy;
}

interface UsePromptFiltersResult {
  filteredPrompts: Prompt[];
  allTags: string[];
  counts: {
    all: number;
    myAll: number;
    own: number;
    web: number;
    others: number;
  };
  mediaCounts: {
    all: number;
    photo: number;
    video: number;
    text: number;
    music: number;
  };
}

/**
 * Хук фильтрации и сортировки промптов.
 * Вынесен из App.tsx для разделения ответственностей.
 */
export function usePromptFilters({
  prompts,
  user,
  searchQuery,
  selectedCategory,
  showFavoritesOnly,
  sourceFilter,
  mediaFilter,
  sortBy,
}: UsePromptFiltersOptions): UsePromptFiltersResult {
  const allTags = useMemo(() => {
    return Array.from(new Set(prompts.flatMap((p) => p.tags || []))).filter(Boolean);
  }, [prompts]);

  const counts = useMemo(() => {
    if (!user) return { all: 0, myAll: 0, own: 0, web: 0, others: 0 };
    return {
      all: prompts.length,
      myAll: prompts.filter((p) => p.userId === user.uid).length,
      own: prompts.filter((p) => p.userId === user.uid && p.promptOrigin !== 'web').length,
      web: prompts.filter((p) => p.userId === user.uid && p.promptOrigin === 'web').length,
      others: prompts.filter((p) => p.userId !== user.uid).length,
    };
  }, [prompts, user]);

  const mediaCounts = useMemo(() => {
    const getType = (p: Prompt) => p.mediaType || 'photo';
    return {
      all: prompts.length,
      photo: prompts.filter((p) => getType(p) === 'photo').length,
      video: prompts.filter((p) => getType(p) === 'video').length,
      text: prompts.filter((p) => getType(p) === 'text').length,
      music: prompts.filter((p) => getType(p) === 'music').length,
    };
  }, [prompts]);

  const filteredPrompts = useMemo(() => {
    const lowerQuery = searchQuery.toLowerCase();

    return prompts
      .filter((p) => {
        const matchesSearch =
          searchQuery === '' ||
          p.title.toLowerCase().includes(lowerQuery) ||
          p.mainPrompt.toLowerCase().includes(lowerQuery) ||
          (p.usageNotes && p.usageNotes.toLowerCase().includes(lowerQuery)) ||
          (p.tags && p.tags.some((t) => t.toLowerCase().includes(lowerQuery))) ||
          p.category.toLowerCase().includes(lowerQuery) ||
          (p.subSections &&
            p.subSections.some(
              (s) =>
                s.title.toLowerCase().includes(lowerQuery) ||
                s.text.toLowerCase().includes(lowerQuery),
            ));

        const matchesCategory = !selectedCategory || p.category === selectedCategory;
        const matchesFavorite = !showFavoritesOnly || p.isFavorite;

        let matchesSource = true;
        if (sourceFilter === 'my-all') {
          matchesSource = p.userId === user?.uid;
        } else if (sourceFilter === 'my-own') {
          matchesSource = p.userId === user?.uid && p.promptOrigin !== 'web';
        } else if (sourceFilter === 'my-web') {
          matchesSource = p.userId === user?.uid && p.promptOrigin === 'web';
        } else if (sourceFilter === 'others') {
          matchesSource = p.userId !== user?.uid;
        }

        const matchesMedia =
          mediaFilter === 'all' || (p.mediaType || 'photo') === mediaFilter;

        return matchesSearch && matchesCategory && matchesFavorite && matchesSource && matchesMedia;
      })
      .sort((a, b) => {
        if (sortBy === 'name') return a.title.localeCompare(b.title);
        if (sortBy === 'usage') return (b.usageCount || 0) - (a.usageCount || 0);
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [prompts, user, searchQuery, selectedCategory, showFavoritesOnly, sourceFilter, mediaFilter, sortBy]);

  return { filteredPrompts, allTags, counts, mediaCounts };
}
