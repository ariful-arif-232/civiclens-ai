import type { Metadata } from 'next';
import { Navbar } from '@/components/Navbar';
import { isDemo } from '@/lib/runtime';
import './globals.css';
export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: { default: 'CivicLens AI · Infrastructure intelligence', template: '%s · CivicLens AI' },
  description: 'From citizen reports to actionable infrastructure intelligence.',
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <a href="#main" className="skip">
          Skip to content
        </a>
        <Navbar demo={isDemo()} />
        <main id="main">{children}</main>
        <footer className="footer">
          <span>© {new Date().getFullYear()} CivicLens AI</span>
          <span>Better evidence. Better priorities. Better places.</span>
          <span>Built for civic action ↗</span>
        </footer>
      </body>
    </html>
  );
}
