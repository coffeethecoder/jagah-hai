# The Train Isn't Full

Quantifying berth fragmentation in railway reservations using order theory and graph colouring.
When a passenger is waitlisted while berths sit empty on parts of the route, is the train full, or just badly packed?
This project simulates booking streams through several allocation strategies and measures how much capacity each loses against the Dilworth bound.


## Run

```bash
npm install
npm run dev        # the web app
npm test           # unit + property tests
npm run coverage   # coverage for src/engine
npm run experiment -- --config experiments/configs/smoke.json
npm run aggregate  -- --run experiments/results/smoke
```
