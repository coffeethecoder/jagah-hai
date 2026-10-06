# Talk and demo script

Three slides, then the simulator. This is the full version with everything in it: about 7 minutes.
Deck: https://claude.ai/artifact/X893R79S2jxKNJVcDj5eR9

## Plan

| Part | Time |
|---|---|
| Slide 1: title | 0:10 |
| Slide 2: the problem, what exists, our solution | 1:25 |
| Slide 3: where discrete maths comes in, and why TypeScript | 2:10 |
| Demo on the simulator | 3:20 |
| Closing line | 0:10 |

The words below are how you might say it, not lines to memorise. Say them your own way.

**To get it down to about 4 minutes,** make these cuts. Together they save about 2:45.

1. Slide 2: say "what exists" in one sentence, and the solution in two (saves 0:40).
2. Slide 3: one sentence for each concept instead of three or four (saves 0:50).
3. Slide 3: TypeScript in one sentence, "the same code runs the demo and the experiments" (saves 0:20).
4. Demo step 1: skip the tour of the left panel (saves 0:15).
5. Demo step 5: skip the red rejection (saves 0:20).
6. Demo step 6: skip Best-fit, Random-fit and the unlimited berths box (saves 0:20).

## Before you start

1. In the project folder run `npm run dev`, open the address it prints, and go to **Simulator**.
2. Set the left panel like this:
   - Route: **Punjab Mail (12137)**
   - Coach: **Sleeper, 72**
   - RAC berths: **None**
   - Trip lengths: **Mixed short and long trips**
   - Demand: **1.4** times capacity
   - Tatkal surge: off
   - Seed: **1**
   - Strategy: **First-fit**, and "Compare with another strategy" unticked
3. The line under the title must end with Seed 1 and **361 requests**. If it does, every number below will match.
4. Drag **Speed** to about 40/s, then press **Reset** so it says "Request 0 of 361".
5. Do not reload the page after this: a reload puts the settings back to the defaults.
6. Put the deck on slide 1 in its own window.

## Slides

### Slide 1: Title (0:10)

> Hi everyone, I'm Neel. My project is called "The Train Isn't Full", and it's about railway waiting lists.

### Slide 2: The problem and our solution (1:25)

The problem. Point at the small chart on the left.

> So here's the problem. Take two berths on a train from Mumbai to Delhi. Berth 1 is free till Surat. Berth 2 is free from Surat onwards.
>
> Now someone wants to go the whole way. There's an empty berth on both halves of the trip, but they still get waitlisted, because no single berth is free from start to end.
>
> So the train isn't really full. The berths were just given out in a bad order.

What exists. Point at the strip at the bottom.

> I looked at what already exists. Apps like ConfirmTkt predict whether a waitlisted ticket will get confirmed, and suggest other trains. The Railways have their own AI system, called Ideal Train Profile, which adjusts how seats are split between stations. And in research there's a paper called "The Seat Reservation Problem", which studies the worst case in theory.
>
> But none of these tells a passenger why they were waitlisted, or whether the train was actually full.

Our solution. Point at the list on the right.

> That's the gap I worked on. I built a web app that replays the bookings of a real train, one by one.
>
> For every waitlisted passenger it gives a proof: either the train really was full, or it was only the way berths were given out. You can compare five ways of giving out berths on exactly the same passengers. It handles RAC as well. And every run is repeatable, because the same seed always gives the same passengers.

### Slide 3: Where discrete maths comes in (2:10)

> Now, where is discrete maths in this? Pretty much everywhere.
>
> First, relations. A booking is an interval on the route, from where you board up to where you get off. Two bookings are related if they overlap. That relation is reflexive and symmetric, but not transitive. The app uses it every single time it checks whether a berth is free.
>
> Second, partial orders. If one passenger gets off before another one boards, the first comes before the second. That's a partial order. The passengers on one berth form a chain. Passengers who all overlap form an antichain, and they all need different berths. By Dilworth's theorem, the fewest berths you need is the size of the biggest antichain, which is just the busiest stretch of the route.
>
> Third, functions and pigeonhole. A seating is a function from bookings to berths. If a stretch already has 72 people on 72 berths, pigeonhole says one more can't fit. That's exactly how the app proves that a train was full.
>
> Fourth, graphs. Make every booking a vertex and join two if they overlap. That's an interval graph, and giving out berths is colouring it. First-fit is simply greedy colouring.
>
> The line at the bottom ties it together. The bookings fit in k berths exactly when no stretch of the route has more than k people on it.

Why TypeScript. No slide for this; say it before you switch.

> One word on the language. Everything is written in TypeScript, and I wrote all the algorithms myself, with no graph libraries.
>
> I picked TypeScript for three reasons. The same code runs in the browser and on my laptop, so the engine in this demo is the exact one I ran my experiments with, not a second copy. The strict type checking catches silly mistakes, like mixing up a booking number with a berth number. And it needs no server, so the app works offline.
>
> Okay, let me show you.

Switch to the browser.

## The demo

### 1. What you're looking at (0:30)

Do: nothing yet. Point at the left panel, then the chart, then the right side.

> This is the simulator. On the left is the setup. You pick a train, and there are three real ones here with their actual stops. You pick the coach, how many RAC berths, how busy the day is, and the rule for giving out berths.
>
> In the middle is the reservation chart. This is one sleeper coach of the Punjab Mail, Mumbai to Firozpur. The 72 berths go down the side and the stations go across the top.
>
> I've generated 361 booking requests for it. That's more than it can hold, so think of it as a busy day.

### 2. Fill the coach (0:30)

Do: click **Play**. Click the button, not the space bar. It takes about 9 seconds.

> I'll press play. Every green bar is one passenger. The rule here is First-fit, the greedy colouring from the slide: each passenger gets the lowest-numbered berth that's free.

When it stops, point at the counters along the top.

> Okay, done. 271 people got a berth and 90 got waitlisted.
>
> But look at these two. "Full here" is zero, and "Assignment" is 90. So not one of those 90 was turned away because the train was full.

### 3. One passenger, and the proof (0:40)

Do: in the **Waitlisted passengers** box on the right, click **207**.

> Let me pick one of them. This is passenger 207, going from Mumbai to Lalitpur.
>
> The app says every stretch of that trip still had a free berth. Even on the busiest stretch only 69 out of 72 were taken. It just was never the same berth all the way.

Do: scroll down past the small table and click **Show a seating that fits everyone**.

> And if I click this, it shows a seating where everybody fits, this passenger too. That amber bar is them.
>
> So that result from the slide isn't just theory. The app uses it for every single rejection.

### 4. Decide berths later (0:30)

Do: scroll back to the top. Under Strategy, click **Deferred**. Click **Jump to end**. Then click **Prepare chart**, just above the grid.

> Now, what if we don't give berth numbers at booking time, and only decide them at charting? That's this option, Deferred. Same 361 requests.
>
> Assignment is zero now. And when I prepare the chart, it seats everybody in boarding order, and they all fit.
>
> But look at seated: 272. That's only one more than before.

### 5. A train that really was full (0:20)

Do: in the Waitlisted passengers box, click the first red number, **196**.

> These red ones are different. Passenger 196, Bhopal to Delhi. One stretch of that trip already had 72 passengers on 72 berths, and the app lists all 72.
>
> That's pigeonhole. Nobody could have seated this person.

### 6. Compare everything (0:40)

Do: look at the table **All strategies on this stream** on the right. Scroll a little if it is cut off.

> This table has all five rules on the same requests. Best-fit picks the berth that leaves the smallest gap, and Random-fit just picks any free one.
>
> First-fit got 271, Deferred got 272. And the best you could possibly do, if you knew every request in advance, is 301.
>
> So on this train, fixing the berth allocation got us one seat. The bigger loss is simply that bookings are first come, first served.

Do: point at **With unlimited berths**, just under the table.

> And this last box is Dilworth's theorem at work. To seat all 361 people you'd need at least 132 berths, because that's the busiest stretch. First-fit would use 138.

### 7. Closing line (0:10)

Do: stay on the simulator. It is the best thing to have on screen for questions.

> So that's my project. When you're waitlisted, the train often isn't full, and this can show it passenger by passenger.
>
> Thank you. I'm happy to take questions, or to run any train you like.

### If the demo breaks

Reload the page, set Route and Demand again from the checklist, press **Jump to end**, and carry on from step 3. The numbers will be the same.

## For questions

### The five strategies, one line each

- **First-fit:** give the lowest-numbered berth that is free for the whole journey.
- **Best-fit:** give the free berth where the journey leaves the smallest gap, so big empty stretches are kept for long trips.
- **Random-fit:** give any free berth at random. It is only a baseline to compare against.
- **Deferred:** accept the passenger if every stretch of their journey has room, but decide all the berth numbers together at charting, in boarding order.
- **Optimum (best possible):** look at every request in advance and keep the largest set of passengers that fits. Nobody can run it in real life, so it is only a ceiling.

The first three fix the berth at booking time, which is why they can turn someone away even when every stretch has room. Deferred never does that.

### Where each concept shows up in the app

- **Relations:** the overlap check that decides whether a berth is free for a journey.
- **Partial orders and Dilworth's theorem:** the "With unlimited berths" box, where the minimum number of berths equals the busiest stretch.
- **Pigeonhole:** every red "Full here" proof.
- **Functions:** a seating is a function from bookings to berths, and two overlapping bookings never get the same berth.
- **Graph colouring:** the strategies. First-fit is greedy colouring, and Deferred colours in boarding order, which always works on an interval graph.
- **Proofs:** the amber "Assignment" proof is a constructive proof. It shows an actual seating that fits everyone.

### What already exists

- **ConfirmTkt and similar apps:** predict the chance that a waitlisted ticket gets confirmed, and suggest other trains or split journeys. They predict; they don't explain.
- **Ideal Train Profile:** an AI system built by CRIS, the Railways' own software arm. It learns from past bookings and adjusts how berths are split between station pairs. It was tried on over 200 trains. It is internal, so passengers can't see how it decides.
- **"The Seat Reservation Problem":** a 1999 paper by Joan Boyar and Kim Larsen. It studies First-fit and Best-fit for train seats in the worst case, in theory.
- **What is different here:** a proof for each rejected passenger, on real Indian routes, that anyone can open and check.

### Why TypeScript

- **One language everywhere:** the engine, the web app and the experiment runner share the same code, so the demo and the experiments cannot disagree.
- **Strict types:** the compiler catches mistakes such as mixing a booking number with a berth number, or forgetting to handle a rejected passenger.
- **No server:** it runs entirely in the browser, so it works offline and anyone can open it.
- **Why not Python:** the algorithms would have had to be written again in JavaScript for the web page, and two copies can drift apart. Python is used only to draw the figures for the paper.

### Questions you may get

- **Is this how IRCTC allocates berths?** No, their method isn't published. I compare a few standard ways of doing it on real routes.
- **Are these real passengers?** The routes are real, the passengers are simulated, because booking data isn't public. The seed fixes them, so the same seed always gives the same day.
- **Is one seat the usual gain?** That was one day on one train. The full results over many runs are in the research part of the project, on the Findings page.
- **Why not just use the best possible method?** It needs every future request in advance, so nobody can run it. It's only there as a ceiling to compare against.
- **What exactly is new?** The theorem is a known one. What I built is an app that proves, for each rejected passenger, whether the train was really full.
