# Talk and demo script

Goes with the 10-slide deck: https://claude.ai/artifact/X893R79S2jxKNJVcDj5eR9
The same per-slide wording is in the deck's speaker notes.

## Plan

About 11 minutes in total. Change "I" to "we" if you present as a team.

| Part | Time | Weight |
|---|---|---|
| Slides 1 to 3: the problem and the model | 2:10 | Light. Set up the question. |
| Slide 4: the theorem | 1:15 | **Heavy.** Everything else depends on it. |
| Slides 5 and 6: tiers, what was built | 1:25 | Light. |
| Live demo | 3:00 | **Heavy.** This is what people remember. |
| Slide 7: how often | 0:40 | Medium. |
| Slide 8: what it costs | 0:55 | **Heavy.** The headline result. |
| Slides 9 and 10: RAC, lessons, conclusion | 1:30 | Light. |

The story in one line: the demo shows fragmentation is real and frequent, then slide 8 shows it is cheap.

**If you only have 8 minutes:** on slide 3 say only the first two paragraphs, skip slide 9, and skip demo step 5.

## Before you start

1. In the project folder run `npm run dev` and open the address it prints, then go to **Simulator**.
2. Set the left panel exactly like this:
   - Route: **Punjab Mail (12137)**
   - Coach: **Sleeper, 72**
   - RAC berths: **None**
   - Trip lengths: **Mixed short and long trips**
   - Demand: **1.4** times capacity
   - Tatkal surge: off
   - Seed: **1**
   - Strategy: **First-fit**, and "Compare with another strategy" unticked
3. The tags under the title must read: 72 berths, Mixed trips, Demand 1.4 times capacity, Seed 1, **361 requests**. If they do, every number in this script will match.
4. Drag **Speed** to about 40/s, then press **Reset** so it says "Request 0 of 361".
5. Do not reload the page after this: a reload puts the settings back to the defaults.
6. Keep the deck in a second window on slide 6, so one key switches between them.

## Slides 1 to 6

### Slide 1: The train isn't full (0:35)

> Good morning. Everyone here has been on a waiting list. And most of us have walked through that same train and seen empty berths.
>
> My project asks one simple question: when you are waitlisted, is the train really full?
>
> The picture on the right is a reservation chart. Each row is a berth. Each green bar is one passenger's journey. The dashed bar is a passenger who was turned away, even though there are gaps all over the chart.
>
> I measured how often that happens, and what it costs.

### Slide 2: Waitlisted while berths sit empty (0:50)

> Here is the smallest version of the problem. Two berths, Mumbai to Delhi, through Surat.
>
> Berth 1 is free up to Surat. Berth 2 is free after Surat. Now a passenger wants to go from Mumbai to Delhi.
>
> There is a free berth on each half of the journey. But no single berth is free all the way, so they are waitlisted.
>
> If the two earlier passengers had been put on the same berth, this request would fit. So the train is not full. It is fragmented.
>
> My research question has two parts. How much capacity is lost this way on real routes? And how much comes back if berth numbers are given only at charting time?

### Slide 3: A berth chart is a graph colouring (0:45)

Keep this one quick.

> To study this I need a model, and it is one idea. A booking is an interval: from the station where you board, up to but not including the station where you get off.
>
> So if I get off at Surat and you board at Surat, we do not overlap, and we can share a berth.
>
> From this one definition, the course topics appear. Overlap is a relation. "Gets off before the other boards" is a partial order, and the passengers of one berth form a chain. Giving berths is a function, and pigeonhole gives the impossibility proofs.
>
> And as a graph: bookings are vertices, overlaps are edges, and giving out berths is colouring an interval graph.

### Slide 4: One theorem sorts every rejection (1:15)

The most important slide. Slow down.

> This is the centre of the project. Theorem 1: a set of bookings fits on k berths if and only if no segment of the route carries more than k passengers.
>
> One direction is pigeonhole. If k plus one people are on the same stretch, they cannot share k berths.
>
> The other direction is constructive. Seat the passengers in boarding order, each on the lowest free berth. It never fails.
>
> Why does this matter? Because it lets me label every single rejection.
>
> If some stretch of your journey already carries k people, the rejection is forced. I call it "full here". No system could have seated you.
>
> But if every stretch still has room, the theorem says a seating exists. So you were turned away only because of earlier berth choices. I call that "assignment".
>
> On the right is the smallest example: three passengers on two berths, and A to C cannot be seated, although every stretch has a free berth.
>
> Red and amber. Please remember these two colours for the demo.

### Slide 5: Three tiers, two kinds of loss (0:55)

> To put a number on the cost, I compare three levels of knowledge.
>
> Tier 1 is booking as we know it: you get a berth number immediately. First-fit takes the lowest free berth. Best-fit takes the tightest gap. Random-fit takes any free berth, as a baseline.
>
> Tier 2, deferred, only promises you a place. It accepts you if every stretch has room, and gives out all the berth numbers together at charting. By the theorem, it can never cause an amber rejection.
>
> Tier 3 is the offline optimum. It sees every request in advance and keeps the largest set that fits. Nobody can run this in real life. It is the ceiling.
>
> The gaps between the tiers are the two losses. Tier 2 minus Tier 1 is what fragmentation costs. Tier 3 minus Tier 2 is what first come, first served costs.

### Slide 6: One engine behind everything (0:30)

> I built three things on one engine. The engine is plain TypeScript, every algorithm written from scratch, and the same seed always gives the same result. A web app that plays a reservation chart one booking at a time. And an experiment runner.
>
> It is checked by 136 tests, including a brute-force check of the optimum. Let me show you the app.

Switch to the browser.

## The demo (3:00)

### 1. Orient (0:20)

Do: nothing yet. Point at the title, then at the empty chart.

> This is one sleeper coach of Punjab Mail, Mumbai CSMT to Firozpur, 54 stops. 72 berths down the side, the route across the top.
>
> I have generated 361 booking requests. That is about 1.4 times what the coach can hold, so a busy day.

### 2. Watch it fill (0:35)

Do: click **Play**. Click the button, not the space bar. It takes about 10 seconds.

> Each bar is one passenger's journey. First-fit puts each one on the lowest-numbered free berth. Watch the counters at the top.

When it stops, point at the four counters one by one.

> 271 seated. 90 turned away.
>
> Now look at these two. Full here: zero. Assignment: ninety.
>
> Not one of those 90 people was refused because the train was full.

### 3. The proof for one passenger (0:55)

Do: in the right panel, click the chip **207 Assignment** (the eighth chip).

> Take passenger 207: Mumbai CSMT to Lalitpur, 21 stretches of the route.
>
> The app gives a proof. Every stretch of this journey still had a free berth. The busiest one carried 69 of 72.
>
> So three berths were free at the worst point, and still no seat, because no single berth was free end to end.

Do: scroll down past the table and click **Show a seating that fits everyone**. A second, tidy chart appears on the right, with an amber bar on berth 4.

> And here is the theorem at work. These are the same passengers booked so far, plus this one: all 201 on 72 berths. The amber bar is our passenger.
>
> Same people in both charts. The left one has gaps. The right one is packed.

### 4. Deferred (0:40)

Do: scroll back to the top. In the left panel under Strategy, click **Deferred**. Then click **Jump to end**.

> Now Tier 2, on the same 361 requests. Deferred gives no berth numbers while booking is open.
>
> Look at the counters. Assignment is zero. Every rejection is red: for those people the train really was full.
>
> And seated: 272. One more than before.
>
> We removed ninety unfair rejections and gained one seat.

Do: click **Prepare chart**, just above the grid. The berths fill in two seconds.

> And this is charting: everyone gets a berth in boarding order, with no gaps.

### 5. All five strategies (0:30)

Do: in the right panel, scroll a little to the table **All strategies on this stream**.

> Here are all five on this same stream. First-fit 271. Deferred 272. And the optimum, which knows the future: 301. Twenty-nine more.
>
> So on this one train, fragmentation cost one seat and arrival order cost twenty-nine.
>
> But this is one stream of passengers. Is it typical?

Switch back to the deck, slide 7.

### If the demo breaks

Say "the app is in the repository, let me show you the numbers instead" and go to slide 7. Slides 7 and 8 carry the result without the demo.

## Slides 7 to 10

### Slide 7: Long routes fragment often (0:40)

> That was one stream of passengers. Here are a hundred streams on each of four routes.
>
> On Punjab Mail and Vivek Express, First-fit turns away about one request in seven although every stretch had room: 14.7 and 13.1 percent.
>
> On the short routes it almost never happens. With 12 stops, journeys have too few ways to interleave.
>
> So fragmentation is a problem of long routes with many stops. The strategy matters too: Best-fit roughly halves the rate, and Random-fit doubles it.

### Slide 8: But it costs almost no seats (0:55)

The headline. Pause before the last line.

> Now the result that surprised me. Those frequent rejections cost almost no seats.
>
> The amber sliver is what fragmentation costs: about one seat per coach on Punjab Mail, and less elsewhere.
>
> The violet bar is what first come, first served costs: 28 seats on Punjab Mail, 32 on Vivek Express.
>
> Why so little? When First-fit wrongly turns someone away, the space they would have used is usually taken by a later passenger. The coach ends up almost as full, just with different people in it.
>
> On the two short routes the number is slightly negative. That is noise around zero.
>
> So the honest answer to my question: fragmentation is frequent, but cheap.

### Slide 9: RAC, and two lessons from testing (0:45)

> Three shorter findings.
>
> One: RAC. Two passengers sharing a side-lower berth is two extra places, so it is the same colouring problem. Nine RAC berths seat about 31 more passengers per coach.
>
> Two: a lesson in rigour. My first rule for splitting passengers between confirmed and RAC looked obviously right. Random testing broke it in 1.2 percent of cases, with a counterexample of only five bookings. I replaced it with a rule I could prove.
>
> Three: counting heads can mislead. Random-fit has the higher performance ratio, yet it fills less of the train, because it turns away long journeys and seats several short ones instead. So a report should always show utilization next to the seated count.

### Slide 10: Conclusion (0:45)

> To conclude. Passengers are right: on long routes, the train often isn't full when you are waitlisted. About one request in seven is turned away for that reason.
>
> But fixing it would seat only about one more passenger per coach. What really costs seats is serving people in arrival order, without knowing who comes next.
>
> The limits. Passengers are simulated, because booking data is not public. I model one coach at a time. And this compares policies. It is not IRCTC's own system, whose algorithm is not published.
>
> Next, I would weight the optimum by distance travelled, and add cancellations.
>
> Everything you saw, the app, the proofs, the tests and the figures, comes from one repository.
>
> Thank you. I am happy to take questions.

## Questions you may get

- **Is this how IRCTC allocates berths?** No. Their algorithm is not published. I compare textbook policies on real routes.
- **Why simulated passengers?** Booking data is not public. I use four trip-length patterns, demand from 0.6 to 1.6 times capacity, and 100 random streams for each. The Findings page shows every combination.
- **In the demo, Best-fit seated fewer than First-fit. Why?** On one stream anything can happen: an early rejection can leave room for two shorter trips later. For the same reason Deferred can lose to First-fit on a single stream. That is why I report averages over 100 streams and never claim it per train.
- **Why not just use the optimum?** It needs every future request in advance. It is a ceiling to measure against. It also counts heads, so it prefers short journeys, which a railway may not want.
- **What is new here?** The theorem is classical. What I add is a proof shown for every single rejection, and a measurement of the two losses on real routes.
- **Why "empirical performance ratio" and not "competitive ratio"?** A competitive ratio is a worst-case guarantee. Mine is measured on simulated streams, so I do not use that name.
