import type { Metadata, Viewport } from 'next';
import './globals.css';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#3b82f6',
};

export const metadata: Metadata = {
  title: 'Tourism Explorer',
  description: 'Discover Korean tourist attractions, restaurants, and cultural events',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Tourism Explorer',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://oapi.map.naver.com" />
        <link rel="dns-prefetch" href="https://tong.visitkorea.or.kr" />
        <link rel="dns-prefetch" href="https://apis.data.go.kr" />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
