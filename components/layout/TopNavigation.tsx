'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Container } from '@/components/layout/Container';

export const TopNavigation: React.FC = () => {
  const pathname = usePathname();

  const navItems = [
    { label: '검색', href: '/search' },
    { label: '즐겨찾기', href: '/favorites' },
  ];

  return (
    <header
      className="bg-white border-b border-gray-200 sticky top-0 z-50"
      data-testid="top-nav"
    >
      <Container>
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            href="/"
            className="text-xl font-bold text-primary-600 transition-colors hover:text-primary-700"
          >
            Tourism Explorer
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-6">
            {navItems.map(({ label, href }) => {
              const isActive = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`transition-colors ${
                    isActive
                      ? 'text-primary-600 font-medium'
                      : 'text-gray-700 hover:text-primary-600'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>
      </Container>
    </header>
  );
};

TopNavigation.displayName = 'TopNavigation';
