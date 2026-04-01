import { createContext, useContext } from 'react';

export type GameTheme = 'classic' | 'agent';

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
