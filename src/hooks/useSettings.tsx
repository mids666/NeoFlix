import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './useAuth';

type CardSize = 'small' | 'medium' | 'large';
type Theme = 'dark' | 'light' | 'system';

interface Settings {
  cardSize: CardSize;
  theme: Theme;
  autoplay: boolean;
  language: string;
}

interface SettingsContextType {
  settings: Settings;
  updateSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
}

const defaultSettings: Settings = {
  cardSize: 'medium',
  theme: 'dark',
  autoplay: true,
  language: 'en',
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const { currentProfile } = useAuth();
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load settings when profile changes
  useEffect(() => {
    if (!currentProfile) {
      setSettings(defaultSettings);
      setIsLoaded(false);
      return;
    }

    const key = `flixlab_settings_${currentProfile.id}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        setSettings(JSON.parse(saved));
      } catch (e) {
        setSettings(defaultSettings);
      }
    } else {
      setSettings(defaultSettings);
    }
    setIsLoaded(true);
  }, [currentProfile?.id]);

  // Save settings and apply theme
  useEffect(() => {
    if (!currentProfile || !isLoaded) return;
    
    const key = `flixlab_settings_${currentProfile.id}`;
    localStorage.setItem(key, JSON.stringify(settings));
    
    // Apply theme
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    if (settings.theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(settings.theme);
    }
  }, [settings, currentProfile?.id, isLoaded]);

  const updateSetting = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSetting }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
