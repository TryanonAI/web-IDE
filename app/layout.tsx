import '@/lib/polyfills';
import '@/styles/globals.css';
import { Toaster } from 'sonner';
import type { Metadata, Viewport } from 'next';
import { ThemeProvider } from 'next-themes';
import { Analytics } from '@vercel/analytics/react';
import CheckConnection from '@/components/common/CheckConnection';
import { MobileProvider } from '@/hooks/use-mobile';
import { GoogleAnalytics, GoogleTagManager } from '@next/third-parties/google';

export const viewport: Viewport = {
  themeColor: '#3e7452',
};

export const metadata: Metadata = {
  title: 'Anon',
  description: 'Anon is a AI powered IDE to build dApps on Arweave',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" style={{ colorScheme: 'dark' }}>
      <GoogleTagManager gtmId="GTM-TBDJQL4Z" />
      <body
        style={{
          fontFamily: 'Inter, Helvetica, Arial, sans-serif',
          margin: 0,
        }}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={true}
        >
          <MobileProvider>
            <CheckConnection>
              {children}
              <Toaster position="bottom-center" />
            </CheckConnection>
            <Analytics />
          </MobileProvider>
        </ThemeProvider>
      </body>
      <GoogleAnalytics gaId="G-X4QGWH9859" />
    </html>
  );
}
