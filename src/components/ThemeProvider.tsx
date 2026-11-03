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
import {
  BRANDING_UPDATED_EVENT,
  DEFAULT_BRANDING,
  applyBrandingToDocument,
  resolveBranding,
  type BrandingCfg,
  type ResolvedBranding,
} from "@/lib/branding";

const SETTINGS_KEY = "aqaar-site-settings";

const SeasonThemeContext = createContext<ResolvedSeasonTheme>(
  resolveSeasonTheme(DEFAULT_THEME)
);
const BrandingContext = createContext<ResolvedBranding>(
  resolveBranding(DEFAULT_BRANDING)
);

export function useSeasonTheme(): ResolvedSeasonTheme {
  return useContext(SeasonThemeContext);
}

/** الهوية (الشعارات/الخطوط/الألوان) المتاحة لكل المكوّنات */
export function useBranding(): ResolvedBranding {
  return useContext(BrandingContext);
}

export default function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ResolvedSeasonTheme>(() =>
    resolveSeasonTheme(DEFAULT_THEME)
  );
  const [branding, setBranding] = useState<ResolvedBranding>(() =>
    resolveBranding(DEFAULT_BRANDING)
  );

  useEffect(() => {
    const applyTheme = () => {
      try {
        const raw = localStorage.getItem(SETTINGS_KEY);
        const stored = raw ? JSON.parse(raw) : {};
        const cfg: Partial<SeasonThemeCfg> = stored?.seasonTheme ?? {};
        const brandCfg: Partial<BrandingCfg> = stored?.branding ?? {};
        const resolved = resolveSeasonTheme(cfg);
        const resolvedBrand = resolveBranding(brandCfg);
        /* الموسم أولاً ثم الهوية: ألوان العلامة تُطبَّق فقط عند إيقاف الموسم */
        applySeasonThemeToDocument(resolved);
        applyBrandingToDocument(resolvedBrand, resolved.active);
        setTheme(resolved);
        setBranding(resolvedBrand);
      } catch {
        const fallback = resolveSeasonTheme(DEFAULT_THEME);
        const fallbackBrand = resolveBranding(DEFAULT_BRANDING);
        applySeasonThemeToDocument(fallback);
        applyBrandingToDocument(fallbackBrand, false);
        setTheme(fallback);
        setBranding(fallbackBrand);
      }
    };

    const onStorage = (event: StorageEvent) => {
      if (event.key === SETTINGS_KEY || event.key === null) applyTheme();
    };

    applyTheme();
    window.addEventListener(SEASON_THEME_UPDATED_EVENT, applyTheme);
    window.addEventListener(BRANDING_UPDATED_EVENT, applyTheme);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(SEASON_THEME_UPDATED_EVENT, applyTheme);
      window.removeEventListener(BRANDING_UPDATED_EVENT, applyTheme);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const showBackdrop =
    theme.active && (Boolean(theme.backgroundImage) || theme.patternOpacity > 0);

  return (
    <SeasonThemeContext.Provider value={theme}>
      <BrandingContext.Provider value={branding}>
        {/* طبقة خلفية الموسم — صورة + نقش، خلف كل المحتوى */}
        {showBackdrop && (
          <div
            aria-hidden
            className="theme-backdrop"
            style={
              theme.backgroundImage
                ? { opacity: Math.max(0.05, theme.backgroundOpacity) }
                : undefined
            }
          />
        )}
        {children}
      </BrandingContext.Provider>
    </SeasonThemeContext.Provider>
  );
}
