import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import '@/styles/globals.css';
import { ThemeProvider } from 'next-themes';
import { ActionProvider } from '@/context/ActionContext';
import { Toaster } from 'sonner';
import { Analytics } from '@vercel/analytics/react';
import ClientInitializer from '@/components/dashboard/ClientInitializer';
import { WalletProvider } from '@/context/WalletContext';
// import AccessControlWrapper from '@/components/AccessControlWrapper';
// import RouteGuard from '@/components/RouteGuard';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

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
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={true}
        >
          <WalletProvider>
            <ActionProvider>
              {/* <AccessControlWrapper> */}
              {/* <RouteGuard> */}
              {children}
              {/* </RouteGuard> */}
              <Toaster position="bottom-center" />
              <ClientInitializer />
              <Analytics />
              {/* </AccessControlWrapper> */}
            </ActionProvider>
          </WalletProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
