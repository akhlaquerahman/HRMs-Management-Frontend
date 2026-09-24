"use client";

import React, { useEffect, useState } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n from '../lib/i18n';

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Update direction based on language
    const updateDir = () => {
      const isRtl = i18n.language === 'ar';
      document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
    };

    updateDir();
    i18n.on('languageChanged', updateDir);
    
    return () => {
      i18n.off('languageChanged', updateDir);
    };
  }, []);

  if (!mounted) {
    return null; // Prevent hydration mismatch
  }

  return (
    <I18nextProvider i18n={i18n}>
      {children}
    </I18nextProvider>
  );
}
