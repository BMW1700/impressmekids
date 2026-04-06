import { createContext, useContext } from 'react';

export type GameTheme = 'classic' | 'agent';
export type GradeMode = 'k5' | '6to12';

export const GameThemeContext = createContext<{
  theme: GameTheme;
  setTheme: (theme: GameTheme) => void;
}>({
  theme: 'classic',
  setTheme: () => {},
});

export const useGameTheme = () => useContext(GameThemeContext);

export const getStoredTheme = (): GameTheme | null => {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem('game_theme');
  if (stored === 'classic' || stored === 'agent') return stored;
  return null;
};

export const setStoredTheme = (theme: GameTheme) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('game_theme', theme);
  }
};

/** Map game theme to grade mode */
export const getGradeMode = (theme: GameTheme | null): GradeMode => {
  return theme === 'agent' ? '6to12' : 'k5';
};

/** Map a book's grade_level (0-12) to the correct grade mode */
export const getGradeModeFromGrade = (grade: number): GradeMode => {
  return grade >= 6 ? '6to12' : 'k5';
};

/** Map grade mode back to theme */
export const getThemeFromGradeMode = (mode: GradeMode): GameTheme => {
  return mode === '6to12' ? 'agent' : 'classic';
};
