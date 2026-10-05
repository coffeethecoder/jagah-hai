import s from '../styles/ui.module.css';

interface Props {
  step: number; total: number; playing: boolean; speed: number;
  onStep: () => void; onTogglePlay: () => void; onReset: () => void; onJumpToEnd: () => void;
  onSpeed: (requestsPerSecond: number) => void;
}

/** The playback toolbar above the chart. Keys: Space = play/pause, right arrow = step, R = reset. */
export function Playback({ step, total, playing, speed, onStep, onTogglePlay, onReset, onJumpToEnd, onSpeed }: Props) {
  const done = step >= total;
  return (
    <div className={s.toolbar} role="group" aria-label="Playback">
      <div className={s.buttons}>
        <button type="button" className={`${s.button} ${s.primary}`} onClick={onTogglePlay} disabled={total === 0} title="Space">
          {playing ? 'Pause' : done && step > 0 ? 'Play again' : 'Play'}
        </button>
        <button type="button" className={s.button} onClick={onStep} disabled={done} title="Right arrow">Step</button>
        <button type="button" className={s.button} onClick={onJumpToEnd} disabled={done}>Jump to end</button>
        <button type="button" className={s.button} onClick={onReset} disabled={step === 0} title="R">Reset</button>
      </div>
      <div className={s.progress} role="progressbar" aria-label="Requests decided" aria-valuemin={0} aria-valuemax={total} aria-valuenow={step}>
        <span className={s.num}>Request {step} of {total}</span>
        <div className={s.track}><span style={{ width: `${total === 0 ? 0 : (100 * step) / total}%` }} /></div>
      </div>
      <label className={s.speed}>
        <span>Speed: <span className={s.num}>{speed}</span>/s</span>
        <input type="range" min={1} max={60} step={1} value={speed} onChange={(e) => onSpeed(Number(e.target.value))} />
      </label>
    </div>
  );
}
