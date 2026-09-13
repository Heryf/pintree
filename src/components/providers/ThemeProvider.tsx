"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const STORAGE_KEY = "pintree-theme";

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const safeGetItem = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const safeSetItem = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    // 隐私模式/夸克 WebView 等环境下忽略写入失败
  }
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // 默认深色主题：首次访问未存储偏好时以 dark 为主，用户可手动切换为浅色
  const [theme, setTheme] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // head 内联脚本已同步设置 <html> 的 dark class，这里只需把 React state 对齐，
    // 避免 useEffect 二次改 class 引发闪烁；隐私模式下 stored 为 null，按默认 dark 兜底。
    const stored = safeGetItem(STORAGE_KEY) as Theme;
    if (stored === "dark" || stored === "light") {
      setTheme(stored);
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    // 持久化用户偏好，刷新后由 head 内联脚本即时恢复
    safeSetItem(STORAGE_KEY, theme);
  }, [theme, mounted]);

  const toggleTheme = useCallback(() => {
    const root = document.documentElement;
    // 以 DOM class 为唯一事实来源：点击瞬间同步算出目标主题，立即响应（0 帧延迟）
    const next: Theme = root.classList.contains("dark") ? "light" : "dark";
    const apply = () => {
      if (next === "dark") {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
      setTheme(next);
    };
    // 优先使用 View Transitions API：旧画面快照与新画面在合成器层交叉淡入淡出，
    // 全页元素（背景/文字/边框）颜色同步平滑过渡，重绘不阻塞交互；
    // Chrome/Edge/夸克/手机 Chrome 均支持；不可用时降级为同步切换（一次重绘，瞬时完成）。
    const doc = document as Document & {
      startViewTransition?: (callback: () => void) => unknown;
    };
    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (typeof doc.startViewTransition === "function" && !reduceMotion) {
      doc.startViewTransition(apply);
    } else {
      apply();
    }
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}