import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import { ThemeProvider } from 'next-themes';

export default function App({ Component, pageProps }: AppProps) {
  return (
    // Bungkus seluruh aplikasi dengan ThemeProvider
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      {/* Bungkus Component dengan div utama. 
        Ini rahasianya biar background seluruh layar (bukan cuma kotaknya doang) 
        ikut berubah warna tanpa kedap-kedip!
      */}
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300">
        <Component {...pageProps} />
      </div>
    </ThemeProvider>
  );
}