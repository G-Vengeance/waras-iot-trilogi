import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import { ThemeProvider } from 'next-themes';

// 1. IMPORT SAKLARNYA DI SINI
import ThemeToggle from '@/components/ThemeToggle'; 

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300">
        
        {/* 2. PASANG SAKLAR MELAYANG DI POJOK KANAN ATAS */}
        <div className="fixed top-6 right-6 z-50">
          <ThemeToggle />
        </div>

        <Component {...pageProps} />
      </div>
    </ThemeProvider>
  );
}