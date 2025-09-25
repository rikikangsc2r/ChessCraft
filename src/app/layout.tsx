import type { Metadata, Viewport } from 'next';
import { PT_Sans, Playfair_Display } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { Header } from '@/components/Header';
import { Analytics } from "@vercel/analytics/react"

const ptSans = PT_Sans({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-pt-sans',
});

const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  weight: ['700'],
  variable: '--font-playfair-display',
});

export const metadata: Metadata = {
  title: 'ChessCraft - Online Multiplayer Chess',
  description: 'Play chess online with friends in real-time. Features offline play, move validation, and a modern, responsive interface.',
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  themeColor: '#F5F5F5',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js').then(registration => {
                    console.log('SW registered: ', registration);
                  }).catch(registrationError => {
                    console.log('SW registration failed: ', registrationError);
                  });
                });
              }
            `,
          }}
        />
      </head>
      <body className={`${ptSans.variable} ${playfairDisplay.variable} font-body antialiased bg-background text-foreground min-h-screen flex flex-col`}>
        <Header />
        <main className="flex-grow">
          {children}
        </main>
        <Toaster />
        <Analytics />
      </body>
    </html>
  );
}
