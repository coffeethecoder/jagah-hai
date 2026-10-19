# The Train Isn't Full

Quantifying berth fragmentation in railway reservations using order theory and graph colouring.
When a passenger is waitlisted while berths sit empty on parts of the route, is the train full, or just badly packed?
This project simulates booking streams on real Indian Railways routes through several allocation strategies, proves for
every waitlisted passenger which of the two it was, and measures how much capacity each strategy loses.

## What is in it

- **Engine** (`src/engine/`): pure TypeScript, every algorithm written from scratch, seeded and deterministic.
  First-fit, Best-fit, Random-fit, Deferred (berths at charting), the offline optimum, the proof for each rejection,
  and re-charting the waitlist.
- **Web app** (`src/ui/`): an Overview, the Simulator (play a coach filling up, inspect any waitlisted passenger,
  re-chart the waitlist), Findings (the experiment results) and Method (the model and the theorem).
- **Experiments** (`experiments/`): every strategy on the same request streams; 192,000 runs for the main study.
- **Routes** (`data/routes/`): Punjab Mail 12137, Vivek Express 22503 and Vande Bharat 26101, checked against
  indianrail.gov.in and NTES, plus a fictional 10-stop demo line.

## Run

```bash
npm install
npm run dev        # the web app
npm test           # unit + property tests
npm run coverage   # coverage for src/engine
npm run experiment -- --config experiments/configs/smoke.json
npm run aggregate  -- --run experiments/results/smoke
```

## Reproduce the results

```bash
npm run experiment -- --config experiments/configs/main.json
npm run aggregate  -- --run experiments/results/main
npm run export-findings -- --run experiments/results/main   # numbers on the Findings page
python analysis/plots.py experiments/results/main/summary.csv   # figures F1-F6 and table T1 (needs analysis/requirements.txt)
```

The same seed always gives the same passengers and the same results.

## Documents

- `docs/SPEC.md`: the specification.
- `docs/MATH.md`: definitions and proofs (draft).
- `docs/DECISIONS.md`: every deviation from the spec, with its date and reason.
- `docs/TALK.md`: the presentation and demo script. `docs/TALK.docx` is the same script for printing; rebuild it with
  `python docs/talk_docx.py` (needs `pip install python-docx`).
