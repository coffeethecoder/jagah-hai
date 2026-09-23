# Routes

Route files follow the schema in SPEC 9.1. Station order is the direction of travel.
`weight` is a modelling assumption: how many journeys start at that station (major junctions 3, others 1).

| File | Source | Verified |
|---|---|---|
| `demo-line.json` | Fictional, for tests and demos | n/a |

Real trains: record the source and access date in the file's `source` field, and note here how each stop order was checked manually. Do not add a train whose stop list cannot be verified.
