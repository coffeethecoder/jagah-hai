import s from '../styles/ui.module.css';

interface Props {
  step: number; total: number; playing: boolean; speed: number;
  onStep: () => void; onTogglePlay: () => void; onReset: () => void; onJumpToEnd: () => void;
  onSpeed: (requestsPerSecond: number) => void;
}

/** The reservation dispatch toolbar above the chart. */
export function Playback({ step, total, playing, speed, onStep, onTogglePlay, onReset, onJumpToEnd, onSpeed }: Props) {
  const done = step >= total;
  return (
    <div className={s.toolbar} role="group" aria-label="Reservation Dispatch Controls">
      <div className={s.buttons}>
        <button type="button" className={`${s.button} ${s.primary}`} onClick={onTogglePlay} disabled={total === 0} title="Toggle play/pause (Space)">
          {playing ? 'Pause' : done && step > 0 ? 'Replay' : 'Dispatch'}
          <kbd className={s.kbd}>␣</kbd>
        </button>
        <button type="button" className={s.button} onClick={onStep} disabled={done} title="Next request (Right arrow)">
          Step
          <kbd className={s.kbd}>→</kbd>
        </button>
        <button type="button" className={s.button} onClick={onJumpToEnd} disabled={done} title="Jump to chart closure">
          End
          <kbd className={s.kbd}>⏭</kbd>
        </button>
        <button type="button" className={s.button} onClick={onReset} disabled={step === 0} title="Reset simulation (R)">
          Reset
          <kbd className={s.kbd}>R</kbd>
        </button>
      </div>

      <div className={s.progress} role="progressbar" aria-label="Reservation stream progress" aria-valuemin={0} aria-valuemax={total} aria-valuenow={step}>
        <span className={s.num}>
          REQ {step.toString().padStart(3, '0')} / {total.toString().padStart(3, '0')}
        </span>
        <div className={s.track}><span style={{ width: `${total === 0 ? 0 : (100 * step) / total}%` }} /></div>
      </div>

      <label className={s.speed}>
        <span>SPEED: <span className={s.num}>{speed}</span>/s</span>
        <input type="range" min={1} max={60} step={1} value={speed} onChange={(e) => onSpeed(Number(e.target.value))} />
      </label>
    </div>
  );
}
