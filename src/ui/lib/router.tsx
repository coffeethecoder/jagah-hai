// Hash routing for a static site with four pages. No library: one hook and one link.
import { useEffect, useState, type ReactNode } from 'react';

export type RoutePath = '/' | '/simulator' | '/findings' | '/method';
const PATHS: RoutePath[] = ['/', '/simulator', '/findings', '/method'];

const read = (): RoutePath => {
  const path = window.location.hash.replace(/^#/, '') || '/';
  return (PATHS as string[]).includes(path) ? (path as RoutePath) : '/';
};

/** The current page; changing page scrolls to the top. */
export function useRoute(): RoutePath {
  const [path, setPath] = useState<RoutePath>(read);
  useEffect(() => {
    const onChange = () => { setPath(read()); window.scrollTo(0, 0); };
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return path;
}

export function Link({ to, className, children, current }: { to: RoutePath; className?: string; children: ReactNode; current?: boolean }) {
  return <a href={`#${to}`} className={className} aria-current={current ? 'page' : undefined}>{children}</a>;
}
