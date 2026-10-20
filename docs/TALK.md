# Talk and demo script

Four slides, then the simulator. About 9 minutes in full; the cuts below bring it to about 6.
Deck: https://claude.ai/artifact/X893R79S2jxKNJVcDj5eR9

## Plan

| Part | Time |
|---|---|
| Slide 1: the question | 0:20 |
| Slide 2: it happens in real life | 0:40 |
| Slide 3: the problem, what exists, our solution | 1:30 |
| Slide 4: the maths, and why TypeScript | 2:15 |
| Demo on the simulator | 3:20 |
| Closing | 0:15 |

The whole talk answers one question: **when you are waitlisted, is the train really full?** Every part comes back to it.

It uses only two colours, and they mean the same thing on the slides and in the app:

- **Red, "Full here":** the train really was full on part of your journey. Nobody could have seated you.
- **Amber, "Fragmented":** every part of your journey had a free berth, but no single berth was free all the way. You were turned away only because of how berths had been given out.

Say these two in your own words early, and keep using exactly these names.

The words below are how you might say it, not lines to memorise.

**For a shorter version,** make these cuts. Together they save about 3 minutes, which brings it to about 6. Keep the Concept lines in the demo: they are what links the maths to the app.

1. Slide 1: skip the second sentence (saves 0:10).
2. Slide 2: say only the first card and the last line (saves 0:25).
3. Slide 3: say "what exists" in one sentence (saves 0:15).
4. Slide 4: one sentence per concept, since the demo names each one again, and skip the transitivity example (saves 0:50).
5. Slide 4: skip TypeScript; keep it for questions (saves 0:20).
6. Demo step 1: just "rows are berths, columns are stretches" (saves 0:10).
7. Demo step 3: skip "Show a seating"; re-chart in step 4 makes the same point (saves 0:20).
8. Demo step 5: keep only the first paragraph (saves 0:25).

For a strict 4 to 5 minutes, also drop slide 2, the "what exists" strip on slide 3 and demo step 5, and keep them for questions.

## Before you start

1. In the project folder run `npm run dev`, open the address it prints, and go to **Simulator**. It opens in the simple view, which hides every option the talk doesn't need.
2. In the left panel set only two things:
   - Route: **Punjab Mail (12137)**
   - Demand: **1.4** times capacity
   Leave First-fit selected.
3. The strip under the train name must show COACH: Sleeper (72B), SEED: #1 and STREAM: **361 Requests**. If it does, every number below will match. (On a laptop screen narrower than a desktop, the coach can start as Mini, 16: click **Show all options**, pick **Sleeper, 72**, then **Simple view**.)
4. Do not reload the page after this: a reload puts the settings back to the defaults.
5. Put the deck on slide 1 in its own window.

## Slides

### Slide 1: The question (0:20)

> Hi everyone, I'm Neel. Most of us have been on a train waiting list. And then we got on that same train and saw empty berths.
>
> So my project asks one simple question: when you are waitlisted, is the train really full?
>
> I'll show you the problem, the maths behind it, and then the app I built to answer it.

### Slide 2: It happens in real life (0:40)

Point at each card in turn.

> First, this is a real problem. RTI data from this year says that in 2025–26, 3.39 crore people could not travel. Their waitlisted ticket never got confirmed.
>
> But berths do go empty. In 2022, ticket checkers on running trains were finding about 7,000 empty berths every day. About 2,700 waitlisted people a day got one of them.
>
> And since 2016, the Railways give berths that are still empty after the final chart to waitlisted people at later stations.

Point at the line at the bottom.

> Berths go empty for many reasons, like no-shows and cancellations. My project looks at one reason: the way berths are given out when people book.

### Slide 3: The problem, and our solution (1:30)

Point at the small chart on the left.

> Here is the smallest example. A coach with two berths, going from Mumbai to Delhi through Surat. Berth 1 is free from Mumbai to Surat. Berth 2 is free from Surat to Delhi.
>
> Now someone wants to go from Mumbai all the way to Delhi. Each half of the trip has a free berth. But no single berth is free for the whole trip, and you can't change berths halfway. So this person is waitlisted.
>
> So there are two reasons you can be waitlisted. One: the train really is full on some part of your trip. I'll show that in red, and call it "full here". Two: there was space on every part of your trip, just not on one berth. That happens because of how earlier berths were given out. I'll show that in amber, and call it "fragmented".

Point at the strip at the bottom.

> What exists today? Apps like ConfirmTkt guess whether your waitlist will clear. The Railways have an AI system that adjusts seat quotas between stations. And there is a research paper on the worst case, in theory. But none of them tells you which of the two reasons it was.

Point at the list on the right.

> So I built a simulator. It replays a real train's bookings, one by one. For every waitlisted person, it proves whether the reason was red or amber. Then it re-plans the berths to fit in as many waitlisted people as possible. And it compares five different rules for giving out berths, on exactly the same passengers.

### Slide 4: Where discrete maths comes in (2:15)

Point at the line under the title.

> First, how I turn the train into maths. A booking is just a piece of the route. It runs from the station where you get on to the station where you get off. If I get off at Surat and you get on at Surat, our trips don't overlap. So we can use the same berth.

Point at each card in turn.

> Relations. Two bookings are related if their trips overlap. This relation is reflexive and symmetric, but not transitive. For example, Mumbai–Surat overlaps Mumbai–Delhi, and Mumbai–Delhi overlaps Surat–Delhi. But Mumbai–Surat and Surat–Delhi don't overlap. The app uses this check every time it looks for a free berth.
>
> Partial orders. Say one trip comes "before" another if it ends before the other one starts. Then the passengers on one berth form a chain: one after another. Passengers whose trips all overlap form an antichain: each of them needs their own berth.
>
> Functions and pigeonhole. Giving out berths is a function: each passenger goes to one berth. If one stretch already has 72 people and there are only 72 berths, a 73rd person can't fit. That's the pigeonhole principle, and it is how the app proves a red rejection.
>
> Graph colouring. Draw each booking as a dot, and join two dots if their trips overlap. Giving out berths is colouring the dots: each berth is a colour, and joined dots need different colours. Each rule in my app is a different way of colouring.

Point at the dark box.

> And one theorem ties it all together. The bookings fit in k berths if and only if no stretch of the route has more than k people. One direction is pigeonhole. For the other, seat people in the order they get on, each on the lowest free berth. That never gets stuck. And it is how the app proves an amber rejection: it actually builds a seating where everyone fits.

No slide for this; say it before you switch.

> Quickly, about the language. I wrote everything in TypeScript, and every algorithm from scratch. The main reason: the same code runs in the browser and on my laptop. So this demo uses the exact engine from my experiments. TypeScript's strict types also catch silly mistakes, like mixing up a booking number and a berth number.
>
> Okay, let me show you.

Switch to the browser.

## The demo (3:20)

Each step below has a **Concept** line: the idea from slide 4 that the audience is looking at in that moment. Name it in one sentence, then move on. Slide 4 explained it; the demo shows it working.

### 1. Read the chart (0:20)

Do: nothing yet. Point at the chart, then the left panel.

> This is one sleeper coach of the Punjab Mail, from Mumbai to Firozpur, with 54 stops. Each row is a berth, and there are 72 of them. Each column is the stretch between two stations. Each green bar will be one passenger's trip.
>
> I've set up a busy day: 361 booking requests. That's about 1.4 times what this coach can hold.

### 2. Fill the coach (0:45)

Concept: **graph colouring** and the **overlap relation**, then **chains**.

Do: click **Dispatch**. Click it with the mouse, not the space bar. It takes about 10 to 15 seconds, so talk while it fills.

> Let me start the bookings. The rule here is First-fit: each passenger gets the lowest-numbered berth that is free for their whole trip. In graph terms, that's greedy colouring. And the question "is this berth free?" is the overlap relation from the slide.

When it stops, point at any one row of the chart.

> Look at any one row. The bars never overlap: each trip ends before the next one starts. So every row is a chain.

Point at the counters along the top.

> 271 people got a berth, and 90 were waitlisted.
>
> Now look at these two numbers. "Full here", in red, is zero. "Fragmented", in amber, is 90. So not one of these 90 people was turned away because the train was full.

### 3. One passenger, and the proof (0:40)

Concept: **the theorem**, and a **constructive proof**.

Do: in **Waitlisted passengers** on the right, click **#207**.

> Let's pick one of them: passenger 207, from Mumbai to Lalitpur. The app says every stretch of this trip still had a free berth. The busiest stretch had 69 of the 72 berths taken. 69 is less than 72, so the theorem says a seating that includes this person must exist.

Do: scroll down past the small table and click **Show a seating that fits everyone**.

> And here it is. The app builds it with the method from the proof. Seat everyone in the order they get on, each on the lowest free berth. The amber bar is passenger 207. So the app doesn't just say a seating exists. It shows you one.

### 4. Re-chart the waitlist (0:40)

Concept: **functions**, and a **greedy algorithm** proved optimal by an **exchange argument** (the swapping argument).

Do: scroll back to the top of the chart and click **Re-chart waitlist**, just above the grid.

> But proving it for one person doesn't help anyone travel. So when booking closes, the app re-charts the coach. Remember, a seating is a function from passengers to berths. Re-charting picks a better one. Everyone who had a berth keeps one, maybe a different one. And as many waitlisted people as possible are added.
>
> Six of the 90 now get a berth. They are the amber bars on the chart, and the green ticks in the list. Passenger 207 is one of them. So 271 becomes 277.
>
> And six is the most anyone could add. The method is simple: go through the waitlist in order of where each person gets off, and add anyone who still fits. A swapping argument proves nothing does better, and my tests check it against trying every possibility.

### 5. Why only six? (0:40)

Concept: **the theorem** again, as the limit on what any rule can do.

Do: point at **Same passengers, other rules**, the three-line table on the right.

> If 90 people were fragmented, why can only six get in? Because each of them had space at the moment they booked. But more people kept booking after them, and those people took the space.
>
> This table runs other rules on the same 361 people. Deferred, which gives out berth numbers only at charting time, seats 272. The best possible is 301. That's the biggest group whose busiest stretch stays within 72, and by the theorem it's the most that can fit. But to get there, you would need to know every booking in advance, and refuse some people who booked early.

### 6. Closing (0:15)

Do: stay on the simulator. It is the best thing to have on screen for questions.

> So, to answer my question: when you are waitlisted, often the train isn't really full. And this app can prove it, one passenger at a time. Better berth allocation wins back a few seats. The bigger loss is that we serve people first come, first served, without knowing who will book next.
>
> Thank you. I'm happy to take questions, or to run any train you like.

### Extra, if asked about pigeonhole or Dilworth

Pigeonhole: under Allocation policy click **Deferred**, click **End**, then click the first red number, **#196**.

> These red ones are the other kind. On one stretch of this trip, all 72 berths were already taken, and the app lists those 72 people. So a 73rd person can't fit. That's pigeonhole.

Dilworth: click **Show all options** and point at **With unlimited berths**, at the bottom right.

> To seat all 361 people, you would need at least 132 berths, because 132 people are on the busiest stretch. That's Dilworth's theorem: the fewest berths you need equals the biggest group of trips that all overlap. First-fit would use 138.

### If the demo breaks

Reload the page, set Route and Demand again, press **End**, and carry on from step 3. The numbers will be the same.

## For questions

### The five strategies, one line each

- **First-fit:** give the lowest-numbered berth that is free for the whole journey.
- **Best-fit:** give the free berth where the journey leaves the smallest gap, so big empty stretches are kept for long trips.
- **Random-fit:** give any free berth at random. It is only a baseline to compare against.
- **Deferred:** accept the passenger if every stretch of their journey has room, but decide all the berth numbers together at charting, in boarding order. It never causes an amber rejection.
- **Optimum (best possible):** look at every request in advance and keep the largest set of passengers that fits. Nobody can run it in real life, so it is only a ceiling.

### What the labels on screen mean

- **CNF, Seated:** passengers with a confirmed berth.
- **WL, Waitlisted:** requests turned away so far.
- **REGRET, Full here:** red. Some stretch of the journey was already full.
- **FRAG, Fragmented:** amber. Every stretch had room, but no single berth was free end to end.
- **Packing Eff.** (under Show all options): passengers seated divided by the most any seating could have fitted for the same requests. Call it the "empirical performance ratio", never a "competitive ratio".
- **Lost seats:** how many fewer that rule seated than Deferred on this stream.
- **With unlimited berths** (under Show all options): how many berths you would need to seat everyone. The minimum equals the busiest stretch, 132 here, which is Dilworth's theorem. First-fit would use 138.

### Where each concept shows up in the app

- **Relations:** the overlap check that decides whether a berth is free for a journey.
- **Partial orders and Dilworth's theorem:** the "With unlimited berths" box, where the fewest berths needed equals the busiest stretch.
- **Pigeonhole:** every red "Full here" proof.
- **Functions:** a seating is a function from bookings to berths; overlapping bookings never get the same berth.
- **Graph colouring:** the strategies. First-fit is greedy colouring; Deferred colours in boarding order, which always works on an interval graph.
- **Constructive proof:** the amber proof shows an actual seating that fits everyone.
- **Greedy algorithm with an exchange argument:** re-charting takes waitlisted passengers in order of where they get off and adds each one that still fits. Swapping any other choice for this one never makes things worse, so it reaches the maximum.

### The theorem, in two lines

- **If more than k people are on one stretch,** they cannot share k berths: pigeonhole.
- **If no stretch has more than k,** seat people in order of boarding, each on the lowest free berth. When someone boards, everyone whose berth is still busy is on the same stretch as them. That stretch holds at most k people including the newcomer, so at most k − 1 berths are busy and one is free.

### What already exists

- **ConfirmTkt and similar apps:** predict the chance that a waitlisted ticket gets confirmed, and suggest other trains or split journeys. They predict; they don't explain.
- **Ideal Train Profile:** an AI system by CRIS, the Railways' software arm. It learns from past bookings and adjusts how berths are split between station pairs, and has been rolled out on over 200 trains. It is internal, so passengers can't see how it decides.
- **"The Seat Reservation Problem":** a 1999 paper by Joan Boyar and Kim Larsen. It studies First-fit and Best-fit for train seats in the worst case, in theory.
- **What is different here:** a proof for each rejected passenger, on real Indian routes, that anyone can open and check.

### The news on slide 2: sources

- **3.39 crore passengers:** Angel One, 14 May 2026, reporting RTI data for 2025–26 (about 92,877 a day, up from 1.65 crore in 2021–22). https://www.angelone.in/news/economy/over-3-39-crore-indians-lost-train-journeys-in-fy26-as-waitlists-tatkal-rush-and-bots-overwhelm-railways
- **7,000 vacant berths a day:** The Tribune (PTI), 18 Sep 2022, on ticket examiners' handheld terminals: in their first four months, about 7,000 vacant berths a day released, and 2,759 waitlisted and 5,448 RAC passengers a day given berths on board, across about 1,390 trains. https://www.tribuneindia.com/news/nation/railways-new-device-checks-real-time-seat-availability-allots-7-000-unconfirmed-passengers-berths-daily-432983
- **Since 2016:** The Tribune (PTI), 30 Sep 2016: berths still vacant at the starting station after the second chart are allotted automatically to waitlisted passengers at later stations. https://www.tribuneindia.com/news/archive/business/rlys-announces-facility-to-clear-wait-listed-passengers-302480
- **Careful in answers:** these empty berths come from no-shows, cancellations and quotas as well as allocation. The news shows the problem is real; it does not say how much of it is fragmentation. That is what the project measures.

### Why TypeScript

- **One language everywhere:** the engine, the web app and the experiment runner share the same code, so the demo and the experiments cannot disagree.
- **Strict types:** the compiler catches mistakes such as mixing a booking number with a berth number, or forgetting to handle a rejected passenger.
- **No server:** it runs entirely in the browser, so it works offline and anyone can open it.
- **Why not Python:** the algorithms would have had to be written again in JavaScript for the web page, and two copies can drift apart. Python is used only to draw the figures for the paper.

### How we know it is right

- **141 automated tests,** covering 99.7% of the engine.
- **Brute force:** on hundreds of small random cases, the optimum and the re-chart are compared with trying every possible subset.
- **Every proof is re-checked:** each red and amber verdict is recomputed independently in the tests.
- **Same seed, same result:** every run can be repeated exactly.

### Questions you may get

- **Is this how IRCTC allocates berths?** No, their method isn't published. I compare standard ways of doing it on real routes.
- **Are these real passengers?** The routes are real, the passengers are simulated, because booking data isn't public. The seed fixes them, so the same seed always gives the same day.
- **Why did re-charting seat only 6 of the 90?** Each of the 90 had room when they asked, but later passengers used it. By the end they all need the same few free berths on the busiest stretch.
- **Could you seat more than 6?** Only by cancelling people who already have tickets. The best possible plan seats 56 of the 90, but it refuses 26 people First-fit had confirmed.
- **Does re-charting respect the waitlist order?** No, it maximises the number of people seated. It can seat two later short trips instead of one earlier long one.
- **Is one seat the usual gain from Deferred?** That was one day on one train. The full results over many runs are in the research part of the project, on the Findings page.
- **What exactly is new?** The theorem is a known one. What I built is an app that proves, for each rejected passenger, whether the train was really full, and then seats as many of them as possible.
