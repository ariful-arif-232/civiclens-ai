'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ScanLine, Plus, ArrowUpRight } from 'lucide-react';
export function Navbar({ demo }: { demo: boolean }) {
  const current = usePathname();
  return (
    <>
      <header className="nav">
        <Link href="/" className="brand">
          <span className="brand-mark">
            <ScanLine size={23} />
          </span>
          CivicLens <span className="ai-tag">AI</span>
        </Link>
        <nav aria-label="Main navigation">
          {[
            ['/', 'Overview'],
            ['/issues', 'Explore issues'],
            ['/dashboard', 'Intelligence'],
            ['/admin', 'Authority'],
          ].map(([href, text]) => (
            <Link
              key={href}
              href={href}
              className={current === href ? 'active' : ''}
              aria-current={current === href ? 'page' : undefined}
            >
              {text}
            </Link>
          ))}
        </nav>
        <Link href="/report" className="button small">
          <Plus size={16} /> Report an issue <ArrowUpRight size={15} />
        </Link>
      </header>
      {demo && (
        <div className="demo-banner">
          <span className="dot" /> Interactive demo · Fictional reports and explicitly simulated
          analysis
        </div>
      )}
    </>
  );
}
