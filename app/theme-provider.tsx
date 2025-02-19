'use client';

import { useState, useEffect } from 'react';
import { MoonIcon, SunIcon } from '@heroicons/react/24/solid';

export default function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  const [darkMode, setDarkMode] = useState(true); // Varsayılan olarak dark mode

  useEffect(() => {
    // Sayfa yüklendiğinde localStorage'dan tema tercihini al
    const savedTheme = localStorage.getItem('theme');
    const isDark = savedTheme ? savedTheme === 'dark' : true; // localStorage boşsa dark mode
    setDarkMode(isDark);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode, mounted]);

  // Sayfa yüklenene kadar hiçbir şey gösterme
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <>
      <button
        onClick={() => setDarkMode(!darkMode)}
        className="fixed top-4 right-4 z-50 p-2 rounded-full bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm shadow-lg hover:scale-110 transition-all duration-200"
      >
        {darkMode ? (
          <SunIcon className="w-6 h-6 text-yellow-500" />
        ) : (
          <MoonIcon className="w-6 h-6 text-gray-700" />
        )}
      </button>
      {children}
    </>
  );
} 