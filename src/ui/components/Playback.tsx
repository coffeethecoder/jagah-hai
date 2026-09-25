import s from '../styles/ui.module.css';

interface Props {
  step: number; total: number; playing: boolean; speed: number;
  onStep: () => void; onTogglePlay: () => void; onReset: () => void; onJumpToEnd: () => void;
  onSpeed: (requestsPerSecond: number) => void;
}

export function Playback({ step, total, playing, speed, onStep, onTogglePlay, onReset, onJumpToEnd, onSpeed }: Props) {
  const done = step >= total;
  return (
    <section className={s.section} aria-labelledby="playback-heading">
      <h2 id="playback-heading">Playback</h2>
      <p className={`${s.hint} ${s.num}`}>Request {step} of {total}</p>
      <div className={s.row}>
        <button type="button" className={`${s.button} ${s.primary}`} onClick={onTogglePlay} disabled={total === 0}>
          {playing ? 'Pause' : done && step > 0 ? 'Play again' : 'Play'}
        </button>
        <button type="button" className={s.button} onClick={onStep} disabled={done}>Step</button>
        <button type="button" className={s.button} onClick={onJumpToEnd} disabled={done}>Jump to end</button>
        <button type="button" className={s.button} onClick={onReset} disabled={step === 0}>Reset</button>
      </div>
      <label className={s.field}>
        <span>Speed <span className={s.num}>{speed}</span> requests per second</span>
        <input type="range" min={1} max={60} step={1} value={speed} onChange={(e) => onSpeed(Number(e.target.value))} />
      </label>
      <p className={`${s.hint} ${s.muted}`}>Keys: Space plays or pauses, the right arrow steps, R resets.</p>
    </section>
  );
}
