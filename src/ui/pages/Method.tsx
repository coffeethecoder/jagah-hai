// Method: the model, the theorem, the strategies, and the limits of the study. Shown more than told.
import type { CSSProperties, ReactNode } from 'react';
import { Diagram } from '../components/Diagram';
import { Link } from '../lib/router';
import { at, findings, seats } from '../lib/findings';
import c from '../styles/site.module.css';

const ROUTE = '12137-punjab-mail';

/** One small drawing per concept, in the chart's own vocabulary of bars. */
const GLYPHS: Record<string, ReactNode> = {
  relations: (
    <>
      <rect x="4" y="8" width="76" height="14" rx="4" fill="var(--brand)" />
      <rect x="52" y="32" width="76" height="14" rx="4" fill="var(--brand)" fillOpacity="0.45" />
      <rect x="52" y="3" width="28" height="48" rx="4" fill="none" stroke="var(--ink)" strokeWidth="1.5" strokeDasharray="4 3" />
    </>
  ),
  posets: (
    <>
      <rect x="4" y="20" width="36" height="14" rx="4" fill="var(--signal-green)" />
      <rect x="44" y="20" width="44" height="14" rx="4" fill="var(--signal-green)" />
      <rect x="92" y="20" width="36" height="14" rx="4" fill="var(--signal-green)" />
      <path d="M40 44v6M44 44v6M88 44v6M92 44v6" stroke="var(--ink-3)" strokeWidth="1.5" />
    </>
  ),
  functions: (
    <>
      <rect x="4" y="4" width="40" height="10" rx="3" fill="var(--brand)" />
      <rect x="4" y="22" width="40" height="10" rx="3" fill="var(--brand)" />
      <rect x="4" y="40" width="40" height="10" rx="3" fill="var(--brand)" />
      <path d="M48 9 L98 16 M48 27 L98 40 M48 45 L98 20" stroke="var(--ink-3)" strokeWidth="1.5" fill="none" />
      <circle cx="110" cy="16" r="11" fill="var(--surface)" stroke="var(--ink)" strokeWidth="1.5" />
      <circle cx="110" cy="40" r="11" fill="var(--surface)" stroke="var(--ink)" strokeWidth="1.5" />
      <text x="110" y="20" textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--ink)">1</text>
      <text x="110" y="44" textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--ink)">2</text>
    </>
  ),
  graphs: (
    <>
      <path d="M16 40 L48 12 L84 40 L116 14 M16 40 L84 40" stroke="var(--ink-3)" strokeWidth="1.5" fill="none" />
      <circle cx="16" cy="40" r="8" fill="var(--brand)" />
      <circle cx="48" cy="12" r="8" fill="var(--signal-green)" />
      <circle cx="84" cy="40" r="8" fill="var(--amber-bright)" />
      <circle cx="116" cy="14" r="8" fill="var(--brand)" />
    </>
  ),
};

const CONCEPTS = [
  { glyph: 'relations', name: 'Overlaps', line: 'A relation on bookings' },
  { glyph: 'posets', name: 'One berth is a chain', line: 'A partial order of journeys' },
  { glyph: 'functions', name: 'Seating is a function', line: 'Bookings to berth numbers' },
  { glyph: 'graphs', name: 'Berths are colours', line: 'Colouring an interval graph' },
];

const NOTES = [
  { paper: 'var(--note-yellow)', tilt: '-2.2deg', head: 'Passengers are simulated', line: "Booking data isn't public." },
  { paper: 'var(--note-pink)', tilt: '1.6deg', head: "Not IRCTC's system", line: "Their algorithm isn't published. We compare policies." },
  { paper: 'var(--note-mint)', tilt: '-1.2deg', head: 'Any berth will do', line: 'No berth preferences, other quotas or cancellations.' },
  { paper: 'var(--note-lilac)', tilt: '2.4deg', head: 'One coach at a time', line: 'And station weights are an assumption.' },
  { paper: 'var(--note-peach)', tilt: '-1.8deg', head: 'One chair-car train', line: 'Vande Bharat is here for its route, not its coach.' },
];

function Arrow() {
  return (
    <svg className={c.arrow} viewBox="0 0 160 14" preserveAspectRatio="none" aria-hidden>
      <path d="M0 7 H150" stroke="currentColor" strokeWidth="2" />
      <path d="M150 1 L160 7 L150 13 Z" fill="currentColor" />
    </svg>
  );
}

export function Method() {
  const fragGain = -at(ROUTE, 'mixed', 'first-fit', 'vsDeferred');
  const fcfsGain = -at(ROUTE, 'mixed', 'deferred', 'vsOptimum');
  const biggest = Math.max(fragGain, fcfsGain);

  return (
    <>
      <header className={c.pageHead}>
        <div className={`${c.container} ${c.stack}`}>
          <p className={c.kicker}>Method</p>
          <h1 className={c.h1}>A berth chart is a graph colouring.</h1>
          <p className={c.lead}>One modelling choice and one theorem. Everything else follows.</p>
        </div>
      </header>

      <div className={`${c.container} ${c.page}`}>
        <section className={c.stack}>
          <p className={c.kicker}>The model</p>
          <h2 className={c.h2}>A booking is an interval.</h2>
          <p className={c.lead}>Get off where someone else boards, and you can share a berth.</p>
          <div className={c.concepts} style={{ marginTop: 'var(--space-6)' }}>
            {CONCEPTS.map((x) => (
              <div key={x.glyph} className={c.concept}>
                <svg viewBox="0 0 132 54" aria-hidden>{GLYPHS[x.glyph]}</svg>
                <h3>{x.name}</h3>
                <p>{x.line}</p>
              </div>
            ))}
          </div>
        </section>

        <section className={c.theorem}>
          <p className={c.kicker}>Theorem 1 (Dilworth's theorem for interval orders)</p>
          <blockquote>Bookings fit k berths if and only if no segment carries more than k passengers.</blockquote>
          <p>Only if: pigeonhole. If: seat passengers in boarding order, each on the lowest free berth. It never fails.</p>
        </section>

        <section className={c.split}>
          <div className={c.stack}>
            <p className={c.kicker}>The consequence</p>
            <h2 className={c.h2}>Every rejection is one of two kinds.</h2>
            <div className={c.twoCol}>
              <div className={`${c.verdict} ${c.verdictRed}`}>
                <span className={`${c.pill} ${c.pillRed}`}>Full here</span>
                <p><b>Forced.</b> A segment already carries k.</p>
              </div>
              <div className={`${c.verdict} ${c.verdictAmber}`}>
                <span className={`${c.pill} ${c.pillAmber}`}>Assignment</span>
                <p><b>Strategy-induced.</b> Room everywhere, but no berth free end to end.</p>
              </div>
            </div>
          </div>
          <Diagram
            stations={['A', 'B', 'C', 'D']}
            rows={[
              { label: 'Berth 1', bars: [{ from: 0, to: 1, text: 'A to B', kind: 'seated' }, { from: 2, to: 3, text: 'C to D', kind: 'seated' }] },
              { label: 'Berth 2', bars: [{ from: 1, to: 3, text: 'B to D', kind: 'seated' }] },
              { label: 'Request', bars: [{ from: 0, to: 2, text: 'A to C: waitlisted', kind: 'request' }] },
            ]}
            caption="The smallest case. Each segment of A to C carries 1 of 2, yet neither berth is free."
          />
        </section>

        <section className={c.stack}>
          <p className={c.kicker}>The strategies</p>
          <h2 className={c.h2}>Three tiers. Each step knows more.</h2>
          <div className={c.flow} style={{ marginTop: 'var(--space-6)' }}>
            <div className={c.node}><span className={c.tag}>Tier 1</span><h3>Berth at booking</h3><p>First-fit, Best-fit, Random-fit</p></div>
            <div className={c.gain}>
              <strong>+{seats(fragGain)}</strong><span>seats</span>
              <div className={c.gainTrack}><i style={{ width: `${Math.max(3, (100 * fragGain) / biggest)}%`, background: '#4a3aa7' }} /></div>
              <Arrow /><span>without fragmentation</span>
            </div>
            <div className={c.node}><span className={c.tag}>Tier 2</span><h3>Berth at charting</h3><p>Deferred</p></div>
            <div className={c.gain}>
              <strong>+{seats(fcfsGain)}</strong><span>seats</span>
              <div className={c.gainTrack}><i style={{ width: `${(100 * fcfsGain) / biggest}%`, background: 'var(--ink-3)' }} /></div>
              <Arrow /><span>knowing every request</span>
            </div>
            <div className={c.node}><span className={c.tag}>Tier 3</span><h3>Offline optimum</h3><p>Proved optimal</p></div>
          </div>
          <p className={c.caption}>Seats gained per coach at each step: Punjab Mail, mixed trips, demand 1.4 times capacity, mean of {findings.meta.seeds} streams.</p>
        </section>

        <section className={c.stack}>
          <p className={c.kicker}>Also in the model</p>
          <h2 className={c.h2}>Proved, then tested.</h2>
          <div className={c.facts} style={{ marginTop: 'var(--space-6)' }}>
            <div className={c.fact}><b>2</b><h3>places per RAC berth</h3><p>So RAC is the same colouring problem.</p></div>
            <div className={c.fact}><b>500</b><h3>random cases per property</h3><p>Checked against brute force.</p></div>
            <div className={c.fact}><b>1</b><h3>seed, one result</h3><p>Reproducible to the byte.</p></div>
          </div>
        </section>

        <section className={c.stack}>
          <p className={c.kicker}>Limits</p>
          <h2 className={c.h2}>What this study does not claim.</h2>
          <ul className={c.notes}>
            {NOTES.map((n) => (
              <li key={n.head} className={c.sticky} style={{ background: n.paper, '--tilt': n.tilt } as CSSProperties}>
                <h3>{n.head}</h3>
                <p>{n.line}</p>
              </li>
            ))}
          </ul>
          <div className={c.ctaRow} style={{ marginTop: 'var(--space-8)' }}>
            <Link to="/simulator" className={`${c.btn} ${c.btnPrimary}`}>Try it in the simulator</Link>
            <Link to="/findings" className={`${c.btn} ${c.btnLight}`}>See the findings</Link>
          </div>
        </section>
      </div>
    </>
  );
}
