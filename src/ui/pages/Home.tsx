// Overview: what the question is, how the study answers it, and what it found.
import { HeroChart } from '../components/HeroChart';
import { Diagram } from '../components/Diagram';
import { Link } from '../lib/router';
import { at, findings, percent, seats } from '../lib/findings';
import c from '../styles/site.module.css';

const HEADLINE_ROUTE = '12137-punjab-mail';

export function Home() {
  const frag = at(HEADLINE_ROUTE, 'mixed', 'first-fit', 'frag');
  const recovered = -at(HEADLINE_ROUTE, 'mixed', 'first-fit', 'vsDeferred');
  const fcfs = -at(HEADLINE_ROUTE, 'mixed', 'deferred', 'vsOptimum');
  const byRoute = findings.routes
    .map((r) => ({ ...r, frag: at(r.id, 'mixed', 'first-fit', 'frag') }))
    .sort((a, b) => b.frag - a.frag);
  const maxFrag = Math.max(...byRoute.map((r) => r.frag));

  return (
    <>
      <section className={c.hero}>
        <HeroChart />
        <div className={`${c.container} ${c.heroInner}`}>
          <p className={c.heroEyebrow}>A study of berth fragmentation on Indian Railways routes</p>
          <h1 className={c.heroTitle}>The train <em>isn't</em> full.</h1>
          <p className={c.heroLead}>
            You're waitlisted, yet berths sit empty along the way. We simulated {findings.meta.runs.toLocaleString('en-US')} booking
            runs on real routes to measure how often that happens, and what it actually costs.
          </p>
          <div className={c.ctaRow}>
            <Link to="/simulator" className={`${c.btn} ${c.btnCream}`}>Open the simulator</Link>
            <Link to="/findings" className={`${c.btn} ${c.btnGhost}`}>See what we found</Link>
          </div>

          <div className={c.heroStats}>
            <div className={c.heroStat}><b>{percent(frag)}</b><span>of requests turned away with a free berth on every stretch</span></div>
            <div className={c.heroStat}><b>{seats(recovered)}</b><span>seats per coach won back by assigning berths at charting</span></div>
            <div className={c.heroStat}><b>{seats(fcfs)}</b><span>seats per coach lost to first come, first served</span></div>
          </div>
          <p className={c.heroNote}>
            Punjab Mail, 54 stops, one 72-berth sleeper coach, demand 1.4 times capacity. Mean of {findings.meta.seeds} simulated booking streams.
          </p>
        </div>
      </section>

      <section className={c.section}>
        <div className={`${c.container} ${c.split}`}>
          <div className={c.stack}>
            <p className={c.kicker}>The problem</p>
            <h2 className={c.h2}>Empty berths, and still no seat.</h2>
            <p className={c.lead}>
              One berth is free to Surat, another from Surat. A passenger going all the way is waitlisted: no single berth is free
              end to end.
            </p>
            <p className={c.lead}><b>The train isn't full. It is fragmented.</b></p>
          </div>
          <Diagram
            stations={['Mumbai', 'Surat', 'Delhi']}
            rows={[
              { label: 'Berth 1', bars: [{ from: 0, to: 1, text: 'free', kind: 'free' }, { from: 1, to: 2, text: 'booked', kind: 'seated' }] },
              { label: 'Berth 2', bars: [{ from: 0, to: 1, text: 'booked', kind: 'seated' }, { from: 1, to: 2, text: 'free', kind: 'free' }] },
              { label: 'Request', bars: [{ from: 0, to: 2, text: 'Mumbai to Delhi: waitlisted', kind: 'request' }] },
            ]}
            caption="Each half of the journey has a free berth. Neither berth is free for the whole journey."
          />
        </div>
      </section>

      <section className={`${c.section} ${c.sectionAlt}`}>
        <div className={c.container}>
          <div className={c.sectionHead}>
            <p className={c.kicker}>How the study works</p>
            <h2 className={c.h2}>From timetable to proof, in four stops.</h2>
          </div>
          <ol className={c.line}>
            <li className={c.stop}><h3>Real routes</h3><p>3 trains, 12 to 60 stops</p></li>
            <li className={c.stop}><h3>Simulated demand</h3><p>Seeded and repeatable</p></li>
            <li className={c.stop}><h3>Five policies</h3><p>The same requests for each</p></li>
            <li className={c.stop}><h3>Every rejection proved</h3><p>Full, or badly packed</p></li>
          </ol>
        </div>
      </section>

      <section className={c.section}>
        <div className={`${c.container} ${c.split}`}>
          <div className={c.stack}>
            <p className={c.kicker}>What it found</p>
            <h2 className={c.h2}>Frequent, but cheap.</h2>
            <p className={c.lead}>
              On long routes, one request in seven is turned away by berth choices, not by a full train. But someone later usually
              takes that space.
            </p>
            <p className={c.lead}><b>What costs seats is not knowing who asks next.</b></p>
            <div className={c.ctaRow}>
              <Link to="/findings" className={`${c.btn} ${c.btnLight}`}>Explore the findings</Link>
            </div>
          </div>
          <div className={c.diagram}>
            <p style={{ fontWeight: 700 }}>Requests First-fit turns away with room on every stretch</p>
            {byRoute.map((r) => (
              <div key={r.id} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '4px 12px', alignItems: 'center' }}>
                <span className={c.rowLabel} style={{ whiteSpace: 'normal' }}>{r.name.replace(/ \(.*\)$/, '')}, {r.stops} stops</span>
                <b style={{ fontVariantNumeric: 'tabular-nums' }}>{percent(r.frag)}</b>
                <div style={{ gridColumn: '1 / -1', height: 10, borderRadius: 999, background: 'var(--surface-2)' }}>
                  <div style={{ width: `${Math.max(1.5, (100 * r.frag) / maxFrag)}%`, height: '100%', borderRadius: 999, background: 'var(--signal-amber)' }} />
                </div>
              </div>
            ))}
            <p className={c.caption}>Mixed trips, demand 1.4 times capacity, mean of {findings.meta.seeds} streams.</p>
          </div>
        </div>
      </section>

      <section className={c.band}>
        <div className={c.container}>
          <div className={c.sectionHead}>
            <h2 className={c.h2}>Built to be checked.</h2>
            <p className={c.lead}>Written from scratch, proved on paper, tested against brute force.</p>
          </div>
          <div className={c.bandGrid}>
            <div><b>136</b><span>automated tests</span></div>
            <div><b>500</b><span>random cases per property, against brute force</span></div>
            <div><b>{findings.meta.runs.toLocaleString('en-US')}</b><span>simulated runs behind the findings</span></div>
            <div><b>99.6%</b><span>of engine code covered by tests</span></div>
          </div>
        </div>
      </section>

      <section className={c.section}>
        <div className={`${c.container} ${c.stack}`} style={{ alignItems: 'flex-start', gap: 'var(--space-6)' }}>
          <h2 className={c.h2}>Watch a train fill up, one booking at a time.</h2>
          <p className={c.lead}>Press Play, then click any waitlisted passenger to see the proof.</p>
          <div className={c.ctaRow}>
            <Link to="/simulator" className={`${c.btn} ${c.btnPrimary}`}>Open the simulator</Link>
            <Link to="/method" className={`${c.btn} ${c.btnLight}`}>Read the method</Link>
          </div>
          <p className={c.note}>Routes are real. Passengers are simulated. This is not IRCTC's own system.</p>
        </div>
      </section>
    </>
  );
}
