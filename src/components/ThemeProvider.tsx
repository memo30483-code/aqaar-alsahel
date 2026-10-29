"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_THEME,
  SEASON_THEME_UPDATED_EVENT,
  applySeasonThemeToDocument,
  resolveSeasonTheme,
  type ResolvedSeasonTheme,
  type SeasonThemeCfg,
} from "@/lib/theme-season";

const SETTINGS_KEY = "aqaar-site-settings";

const SeasonThemeContext = createContext<ResolvedSeasonTheme>(
  resolveSeasonTheme(DEFAULT_THEME)
);

export function useSeasonTheme(): ResolvedSeasonTheme {
  return useContext(SeasonThemeContext);
}

export default function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ResolvedSeasonTheme>(() =>
    resolveSeasonTheme(DEFAULT_THEME)
  );

  useEffect(() => {
    const applyTheme = () => {
      try {
        const raw = localStorage.getItem(SETTINGS_KEY);
        const cfg: Partial<SeasonThemeCfg> = raw
          ? JSON.parse(raw)?.seasonTheme ?? {}
          : {};
        const resolved = resolveSeasonTheme(cfg);
        applySeasonThemeToDocument(resolved);
        setTheme(resolved);
      } catch {
        const fallback = resolveSeasonTheme(DEFAULT_THEME);
        applySeasonThemeToDocument(fallback);
        setTheme(fallback);
      }
    };

    const onStorage = (event: StorageEvent) => {
      if (event.key === SETTINGS_KEY || event.key === null) applyTheme();
    };

    applyTheme();
    window.addEventListener(SEASON_THEME_UPDATED_EVENT, applyTheme);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(SEASON_THEME_UPDATED_EVENT, applyTheme);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const showBackdrop =
    theme.active && (Boolean(theme.backgroundImage) || theme.patternOpacity > 0);

  return (
    <SeasonThemeContext.Provider value={theme}>
      {/* طبقة خلفية الموسم — صورة + نقش، خلف كل المحتوى */}
      {showBackdrop && (
        <div
          aria-hidden
          className="theme-backdrop"
          style={
            theme.backgroundImage
              ? {
                  backgroundImage: `url("${theme.backgroundImage}")`,
                  opacity: Math.max(0.05, theme.backgroundOpacity),
                }
              : undefined
          }
        />
      )}
      {children}
    </SeasonThemeContext.Provider>
  );
}
