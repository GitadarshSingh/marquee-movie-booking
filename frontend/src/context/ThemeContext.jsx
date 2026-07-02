import { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext(null);

const THEMES = ["dark", "midnight", "crimson", "light"];

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(
    localStorage.getItem("bms_theme") || "dark"
  );

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("bms_theme", theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}