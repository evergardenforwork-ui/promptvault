import { useEffect, RefObject } from 'react';

interface UseHotkeysOptions {
  user: { uid: string } | null;
  searchInputRef: RefObject<HTMLInputElement | null>;
  onOpenNewForm: () => void;
  onCloseAll: () => void;
}

/**
 * Глобальные клавиатурные сочетания для PromptVault:
 *   Ctrl+K  → фокус на поле поиска
 *   Ctrl+N  → открыть форму создания промпта
 *   Escape  → закрыть все модальные окна
 */
export function useHotkeys({
  user,
  searchInputRef,
  onOpenNewForm,
  onCloseAll,
}: UseHotkeysOptions) {
  useEffect(() => {
    const handleKeys = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.ctrlKey && e.key === 'n') {
        e.preventDefault();
        if (user) onOpenNewForm();
      }
      if (e.key === 'Escape') {
        onCloseAll();
      }
    };

    window.addEventListener('keydown', handleKeys);
    return () => window.removeEventListener('keydown', handleKeys);
  }, [user, searchInputRef, onOpenNewForm, onCloseAll]);
}
