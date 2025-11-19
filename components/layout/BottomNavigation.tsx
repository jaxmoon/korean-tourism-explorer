'use client';

import React from 'react';
import Link from 'next/link';
import { Home, Search, Heart, Menu } from 'lucide-react';
import { usePathname } from 'next/navigation';

export const BottomNavigation: React.FC = () => {
  const pathname = usePathname();

  const navItems = [
    { icon: Home, label: '홈', href: '/' },
    { icon: Search, label: '검색', href: '/search' },
    { icon: Heart, label: '즐겨찾기', href: '/favorites' },
    { icon: Menu, label: '더보기', href: '/more' },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50"
      data-testid="bottom-nav"
    >
      <div className="flex justify-around items-center h-16">
        {navItems.map(({ icon: Icon, label, href }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center justify-center w-full h-full transition-colors ${
                isActive ? 'text-primary-600' : 'text-gray-600'
              }`}
              aria-current={isActive ? 'page' : undefined}
              aria-label={label}
            >
              <Icon className="w-6 h-6" aria-hidden="true" />
              <span className="text-xs mt-1">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

BottomNavigation.displayName = 'BottomNavigation';
