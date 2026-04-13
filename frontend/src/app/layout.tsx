import type { Metadata } from 'next';
import './globals.css';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'OSstore — Open-Source App Store',
  description: 'Discover, explore, and install trusted open-source software with AI-powered search and security scanning.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[var(--background)] antialiased flex flex-col">
        <NavBar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
