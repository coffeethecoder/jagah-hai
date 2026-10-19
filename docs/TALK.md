# Talk and demo script

Three slides, then the simulator. About 7 minutes; the cuts for a 4-minute version are listed below.
Deck: https://claude.ai/artifact/X893R79S2jxKNJVcDj5eR9

## Plan

| Part | Time |
|---|---|
| Slide 1: the question | 0:20 |
| Slide 2: the problem, what exists, our solution | 1:20 |
| Slide 3: the maths, and why TypeScript | 2:00 |
| Demo on the simulator | 2:50 |
| Closing | 0:15 |

The whole talk answers one question: **when you are waitlisted, is the train really full?** Every part comes back to it.

It uses only two colours, and they mean the same thing on the slides and in the app:

- **Red, "Full here":** the train really was full on part of your journey. Nobody could have seated you.
- **Amber, "Fragmented":** every part of your journey had a free berth, but no single berth was free all the way. You were turned away only because of how berths had been given out.

Say these two in your own words early, and keep using exactly these names.

The words below are how you might say it, not lines to memorise.

**For a 4-minute version,** cut these. Together they save about 2:30, which brings it to about 4:15.

1. Slide 2: say "what exists" in one sentence (saves 0:15).
2. Slide 3: one sentence per concept, and skip the transitivity example (saves 0:50).
3. Slide 3: skip TypeScript; keep it for questions (saves 0:20).
4. Demo step 1: just "rows are berths, columns are stretches" (saves 0:10).
5. Demo step 3: skip "Show a seating"; re-chart in step 4 makes the same point (saves 0:15).
6. Demo step 5: keep only the first paragraph (saves 0:20).
7. Slide 1: skip the second sentence (saves 0:10).

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

> Hi everyone, I'm Neel. Most of us have been on a train waiting list, and then walked through that same train and seen empty berths.
>
> So my project asks one question: when you're waitlisted, is the train really full? I'll show you the problem, the maths behind it, and then the app I built to answer it.

### Slide 2: The problem, and our solution (1:20)

Point at the small chart on the left.

> Here's the smallest example. Two berths, Mumbai to Delhi, through Surat. Berth 1 is free till Surat, and berth 2 is free after Surat.
>
> Someone wants to go all the way. There's a free berth on both halves of the trip, but they're still waitlisted, because no single berth is free from start to end, and you can't change berths halfway.
>
> So there are two reasons you can be waitlisted. Either some part of your journey is genuinely full: I'll show that in red and call it "full here". Or there was room everywhere, just in the wrong places, because of how earlier berths were given out: that's amber, "fragmented".

Point at the strip at the bottom.

> Apps like ConfirmTkt predict whether your waitlist will confirm. The Railways' own AI, Ideal Train Profile, adjusts quotas between stations. And a research paper, "The Seat Reservation Problem", studies the worst case in theory. None of them tells a passenger which of the two reasons it was.

Point at the list on the right.

> So I built a simulator that replays a real train's bookings, and for every waitlisted passenger proves whether it was red or amber. Then it re-charts the coach to seat as many waitlisted people as possible, and it compares five ways of giving out berths on exactly the same passengers.

### Slide 3: Where discrete maths comes in (2:00)

Point at the line under the title.

> Everything starts from one modelling choice. A booking is an interval on the route, from where you board up to where you get off. If I get off at Surat and you board at Surat, our intervals only touch, so we can share a berth.

Point at each card in turn.

> Relations: two bookings are related if they overlap. It's reflexive and symmetric, but not transitive. Mumbai to Surat overlaps Mumbai to Delhi, which overlaps Surat to Delhi, but Mumbai to Surat and Surat to Delhi only touch. The app checks this relation every time it looks for a free berth.
>
> Partial orders: one booking comes before another if it ends before the other starts. The passengers on one berth form a chain. Passengers who all overlap form an antichain, so each needs a different berth.
>
> Functions and pigeonhole: a seating is a function from bookings to berths. If one stretch already has 72 people on 72 berths, a 73rd can't fit. That's the proof behind every red rejection.
>
> Graph colouring: make each booking a vertex and join two that overlap. Giving out berths is colouring this graph, and each strategy is a different colouring rule.

Point at the dark box.

> This theorem ties it together. The bookings fit in k berths exactly when no stretch has more than k people on it. One direction is pigeonhole. For the other, seat people in boarding order on the lowest free berth, and it never gets stuck. That's how the app proves an amber rejection: it builds a seating that fits everyone.

No slide for this; say it before you switch.

> I wrote it all in TypeScript, every algorithm from scratch. Mainly because the same code runs in the browser and on my laptop, so this demo uses the exact engine my experiments used. And strict types catch mistakes like mixing up a booking number with a berth number.
>
> Okay, let me show you.

Switch to the browser.

## The demo (2:50)

### 1. Read the chart (0:20)

Do: nothing yet. Point at the chart, then the left panel.

> This is one sleeper coach of the Punjab Mail, Mumbai to Firozpur, 54 stops. Each row is a berth, 72 of them. Each column is the stretch between two stations. A green bar will be one passenger's trip.
>
> On the left I've set up a busy day: 361 booking requests, about 1.4 times what this coach can hold.

### 2. Fill the coach (0:30)

Do: click **Dispatch**. Click it with the mouse, not the space bar. It takes about 10 to 15 seconds.

> I'll start the bookings. The rule here is First-fit, the simplest colouring: each passenger gets the lowest-numbered berth that is free for their trip.

When it stops, point at the counters along the top.

> 271 people got a berth, and 90 were waitlisted.
>
> Now the important part. "Full here", the red one, is zero. "Fragmented", the amber one, is 90. So not one of those 90 people was turned away because the train was full.

### 3. One passenger, and the proof (0:30)

Do: in **Waitlisted passengers** on the right, click **#207**.

> Let's take one of them, passenger 207, Mumbai to Lalitpur. The app says every stretch of that trip still had a free berth. Even the busiest stretch had only 69 of 72 taken.

Do: scroll down past the small table and click **Show a seating that fits everyone**.

> And here's the proof. This is an actual seating where everyone booked so far fits, including passenger 207, that amber bar. That's the theorem from the slide, built for this one passenger.

### 4. Re-chart the waitlist (0:30)

Do: scroll back to the top of the chart and click **Re-chart waitlist**, just above the grid.

> Proving it one passenger at a time doesn't help anyone travel. So once booking closes, the app re-charts the coach. Everyone who has a berth keeps one, though some move, and it fits in as many waitlisted people as possible.
>
> Six of the 90 get a berth: the amber bars, and the green ticks in the waitlist. Passenger 207 is one of them. So 271 becomes 277, and six is provably the most you can add without cancelling anyone's ticket.

### 5. Why only six? (0:30)

Do: point at **Same passengers, other rules**, the three-line table on the right.

> If 90 were fragmented, why only six? Because each of them had room at the moment they asked, but people kept booking after them and used that room.
>
> This runs other rules on the same 361 people. Deciding berths only at charting, Deferred, gets 272. The best possible, if you knew every request in advance, is 301. But that would mean refusing people who booked early, and you can't know the future.

### 6. Closing (0:15)

Do: stay on the simulator. It is the best thing to have on screen for questions.

> So, to answer the question: when you're waitlisted, often the train isn't actually full, and this app can prove it passenger by passenger. Fixing the allocation wins back a few seats. The bigger loss is that we serve people first come, first served without knowing who comes next.
>
> Thank you. Happy to take questions, or to run any train you like.

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
