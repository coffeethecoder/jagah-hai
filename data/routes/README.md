# Routes

Route files follow the schema in SPEC 9.1. Station order is the direction of travel.
`weight` is a modelling assumption: how many journeys start at that station (major junctions 3, others 1).

| File | Source | Verified |
|---|---|---|
| `demo-line.json` | Fictional, for tests and demos | n/a |
| `12137-punjab-mail.json` | indianrail.gov.in train schedule, accessed 2026-09-26 (`raw/12137.txt`) | Yes: NTES, 2026-09-26 (`raw/12137-ntes.txt`). Same 54 stations, same order |
| `22503-vivek-express.json` | indianrail.gov.in train schedule, accessed 2026-09-26 (`raw/22503.txt`) | Yes: NTES, 2026-09-26 (`raw/22503-ntes.txt`). Same 60 stations, same order |
| `26101-vande-bharat.json` | indianrail.gov.in train schedule, accessed 2026-09-26 (`raw/26101.txt`) | Yes: NTES, 2026-09-26 (`raw/26101-ntes.txt`). Same 12 stations, same order |

Real trains: record the source and access date in the file's `source` field, and note here how each stop order was checked manually. Do not add a train whose stop list cannot be verified.

## How real routes are built

- `raw/<train>.txt` is the schedule exactly as copied from the primary source (indianrail.gov.in); `raw/<train>-ntes.txt` is the NTES copy used to verify stop order.
- Verification: station codes compared in order between the two copies by script; any difference means the train is not used.
- `km` comes from the primary source. The simulation never uses km (only the stop sequence), so the small gaps between sources below do not affect results.
- Stop order, station codes and cumulative `km` come straight from it. Rows marked "Via Station" (the train passes without stopping) and "Deleted" (halt withdrawn) are not stops and are left out; rows marked "Diverted" are kept, as the regular route. Station names are converted mechanically from the source's capitals to title case (the UI avoids all-caps labels); abbreviations are not expanded.
- Weight 3 marks terminals, large cities and main junctions; every other stop is 1. The weight-3 list per train is below.

### 12137 Punjab Mail (CSMT → FZR, 54 stops, 1,936 km)

- Weight 3: CSMT, DR, KYN, MMR, BSL, ET, BPL, NDLS, BTI, FZR.
- On 2026-09-26 stops 19–31 (BHS Vidisha to RKM Raja Ki Mandi) were marked "Diverted". NTES the same day lists all of them as normal stops with timings, so the diversion was temporary; the file keeps the regular 54-stop route.
- km: NTES is 0–10 km lower than indianrail (terminus 1,928 vs 1,936).

### 22503 Vivek Express (CAPE → DBRG, 60 stops, 4,188 km)

- Weight 3: CAPE, TVC, ERN, CBE, BZA, VSKP, BBS, KGP, NJP, GHY, DBRG.
- Left out: TRVL Tiruvalla ("Deleted" on 2026-09-26) and the pass-through rows PTJ, CBF, AJJ, BXJ, DJG ("Via Station"). NTES lists none of them, which confirms the 60-stop list.
- km: NTES is 0–33 km lower than indianrail (terminus 4,158 vs 4,188).
- NTES marks VSKP Visakhapatnam as a train reversal point; the direction of travel for passengers is unchanged, so it stays a normal stop.
- The source lists a halt of 1460:00 at VSKP; times are not used, so this does not affect the route.

### 26101 Vande Bharat (PUNE → AJNI, 12 stops, 881 km)

- Weight 3: PUNE, MMR, BSL, AK, AJNI.
- Left out: ANK Ankai ("Via Station"); NTES does not list it.
- km: NTES is 1 km lower to 5 km higher than indianrail (terminus 886 vs 881).
- Chair car only (EC, CC): the real train has seats, not berths, and no RAC. The seat-assignment problem is the same interval colouring, but a 72-berth sleeper coach with RAC is not this train's coach. Included in `main.json` with the same 72-berth coach as the other routes: it models the route structure, not the real coach (state this in the paper).
- The return train 26102 (AJNI → PUNE, NTES 2026-09-26) has the same 12 stops in reverse; it was not added.
