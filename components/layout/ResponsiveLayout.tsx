'use client';

import React from 'react';
import { TopNavigation } from './TopNavigation';
import { BottomNavigation } from './BottomNavigation';
import { useMediaQuery } from '@/hooks/useMediaQuery';

export interface ResponsiveLayoutProps {
  children: React.ReactNode;
}

export const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({ children }) => {
  const isMobile = useMediaQuery('(max-width: 767px)');

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Navigation (Tablet & Desktop) */}
      {!isMobile && <TopNavigation />}

      {/* Main Content */}
      <main className={`flex-1 ${isMobile ? 'pb-16' : 'pb-0'}`}>
        {children}
      </main>

      {/* Bottom Navigation (Mobile) */}
      {isMobile && <BottomNavigation />}
    </div>
  );
};

ResponsiveLayout.displayName = 'ResponsiveLayout';
