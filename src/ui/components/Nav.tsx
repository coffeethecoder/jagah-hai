import { Link, type RoutePath } from '../lib/router';
import c from '../styles/site.module.css';

const LINKS: { to: RoutePath; label: string }[] = [
  { to: '/', label: 'Overview' },
  { to: '/simulator', label: 'Simulator' },
  { to: '/findings', label: 'Findings' },
  { to: '/method', label: 'Method' },
];

/** The mark: a tiny reservation chart, two seated journeys and one that did not fit. */
function Mark() {
  return (
    <svg width="26" height="22" viewBox="0 0 26 22" aria-hidden>
      <rect x="0" y="1" width="16" height="5" rx="1.5" fill="var(--green-bright)" />
      <rect x="19" y="1" width="7" height="5" rx="1.5" fill="var(--green-bright)" />
      <rect x="0" y="8.5" width="8" height="5" rx="1.5" fill="var(--green-bright)" />
      <rect x="11" y="8.5" width="15" height="5" rx="1.5" fill="var(--green-bright)" />
      <rect x="4.75" y="16.75" width="16.5" height="4.5" rx="1.5" fill="none" stroke="var(--amber-bright)" strokeWidth="1.5" strokeDasharray="3 2" />
    </svg>
  );
}

export function Nav({ path }: { path: RoutePath }) {
  return (
    <header className={c.nav}>
      <div className={c.navInner}>
        <Link to="/" className={c.brand}><Mark /><span>The Train Isn't Full</span></Link>
        <nav className={c.links} aria-label="Main">
          {LINKS.map((l) => <Link key={l.to} to={l.to} current={path === l.to}>{l.label}</Link>)}
        </nav>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className={c.footer}>
      <div className={`${c.container} ${c.footerInner}`}>
        <p>Routes are real; passengers are simulated. This compares allocation policies, not IRCTC's own system, which is not published.</p>
        <nav aria-label="Footer">
          {LINKS.map((l) => <Link key={l.to} to={l.to}>{l.label}</Link>)}
        </nav>
      </div>
    </footer>
  );
}
