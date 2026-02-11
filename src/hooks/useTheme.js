import { useEffect } from "react";

export default function useTheme(isDark) {
  useEffect(() => {
    const root = document.documentElement; // <html>

    if (isDark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [isDark]);
}
