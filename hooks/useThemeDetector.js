// src/hooks/useThemeDetector.js
import { useState, useEffect } from 'react';

export const useThemeDetector = () => {
    const [theme, setTheme] = useState('light');

    useEffect(() => {
        const checkTheme = () => {
            // --- FIX: Check both the <html> AND the <body> for the 'dark' class ---
            // This makes the hook more robust.
            const isDark = document.documentElement.classList.contains('dark') || document.body.classList.contains('dark');
            setTheme(isDark ? 'dark' : 'light');
        };

        checkTheme(); // Check initially

        // Set up observers for both possible locations of the .dark class
        const observer = new MutationObserver(checkTheme);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });

        return () => observer.disconnect(); // Cleanup observer
    }, []);

    return theme;
};