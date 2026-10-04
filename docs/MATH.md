# Proofs

Full proofs for the paper: Lemma 1, Theorem 1, correctness of Algorithm EST, optimality of Algorithm 4.5, and Lemma 2 (RAC), plus the consequences the simulator relies on. Notation follows SPEC Section 3. Every result below is also checked empirically by the property tests named in brackets (fast-check, ≥ 500 random instances each).

*Status: draft by Claude Code, 2026-09-26. To be checked by the author and supervisor.*

---

## 0. Notation

- A route has stations $s_0, \dots, s_n$ and segments $0, \dots, n-1$; segment $j$ runs from $s_j$ to $s_{j+1}$.
- A booking $b$ is a pair of integers $0 \le b.\mathit{from} < b.\mathit{to} \le n$. It **covers** segment $j$ iff $b.\mathit{from} \le j < b.\mathit{to}$ (half-open interval).
- $\mathrm{load}_B(j) = |\{b \in B : b \text{ covers } j\}|$ and $L(B) = \max_j \mathrm{load}_B(j)$ ($L(\emptyset) = 0$).
- $a$ **overlaps** $b$ iff $a.\mathit{from} < b.\mathit{to}$ and $b.\mathit{from} < a.\mathit{to}$.
- A **$k$-assignment** of $B$ is $f : B \to \{0, \dots, k-1\}$ with $f(a) \ne f(b)$ whenever $a \ne b$ overlap (a proper $k$-colouring of the interval graph).
- $a \prec b$ iff $a.\mathit{to} \le b.\mathit{from}$.

**Fact 0.1 (overlap = a shared segment).** $a$ and $b$ overlap iff some segment is covered by both.

*Proof.* If $j$ is covered by both, then $a.\mathit{from} \le j < b.\mathit{to}$ and $b.\mathit{from} \le j < a.\mathit{to}$. Conversely, if they overlap, let $j = \max(a.\mathit{from}, b.\mathit{from})$. Then $j < a.\mathit{to}$ (as $a.\mathit{from} < a.\mathit{to}$ and $b.\mathit{from} < a.\mathit{to}$) and likewise $j < b.\mathit{to}$, so both cover $j$. ∎

In particular, bookings that touch ($a.\mathit{to} = b.\mathit{from}$) do not overlap: a passenger leaving at $s_j$ and one boarding at $s_j$ can share a berth.

**Fact 0.2 ($\prec$ is an interval order whose chains and antichains are the non-overlapping and overlapping sets).** $\prec$ is irreflexive (since $a.\mathit{from} < a.\mathit{to}$) and transitive ($a.\mathit{to} \le b.\mathit{from} < b.\mathit{to} \le c.\mathit{from}$). Two distinct bookings are comparable iff they do not overlap: "not overlapping" means $a.\mathit{from} \ge b.\mathit{to}$ or $b.\mathit{from} \ge a.\mathit{to}$, i.e. $b \prec a$ or $a \prec b$. Hence a **chain** is a set of pairwise non-overlapping bookings (the passengers of one berth) and an **antichain** is a set of pairwise overlapping bookings. ∎

---

## 1. Lemma 1 (Helly property on a line)

**Lemma 1.** A non-empty set $A$ of pairwise overlapping bookings has a segment covered by every member of $A$.

*Proof.* Let $u \in A$ maximise $\mathit{from}$ and $v \in A$ minimise $\mathit{to}$; put $m = u.\mathit{from}$ and $M = v.\mathit{to}$. If $u = v$ then $m < M$ because $u.\mathit{from} < u.\mathit{to}$; otherwise $u$ and $v$ overlap, so $u.\mathit{from} < v.\mathit{to}$, i.e. again $m < M$. For every $w \in A$: $w.\mathit{from} \le m$ (choice of $u$) and $w.\mathit{to} \ge M > m$ (choice of $v$), so $w$ covers segment $m$. ∎

**Corollary 1 (largest antichain).** The largest antichain of $(B, \prec)$ has exactly $L(B)$ elements.

*Proof.* By Lemma 1 an antichain shares a segment $j$, so its size is at most $\mathrm{load}_B(j) \le L(B)$. The bookings covering a busiest segment are pairwise overlapping (Fact 0.1), an antichain of size $L(B)$. ∎

---

## 2. Theorem 1 (feasibility)

**Theorem 1.** $B$ has a $k$-assignment iff $L(B) \le k$.

*Proof.* (⇒) Let $j$ be a segment with $\mathrm{load}_B(j) = L(B)$. Those bookings pairwise overlap (they share $j$), so a $k$-assignment gives them pairwise distinct values in a set of size $k$; by the pigeonhole principle $L(B) \le k$.

(⇐) Theorem 2 below constructs a $k$-assignment whenever $L(B) \le k$. ∎

**Relation to Dilworth's theorem.** Berths are chains (Fact 0.2), so the least number of berths that seats $B$ is the least size of a chain partition of $(B, \prec)$. Theorem 1 with Corollary 1 says this equals the size of the largest antichain, which is Dilworth's theorem for this poset. The proof here is constructive and specific to interval orders: Algorithm EST produces the optimal chain partition directly.

---

## 3. Theorem 2 (Algorithm EST is correct)

Algorithm EST (SPEC 4.2): sort $B$ by $(\mathit{from}, \mathit{to}, \mathit{id})$ ascending; keep $\mathit{lastEnd}[0..k-1] = 0$; for each $b$ in order, give $b$ the lowest berth $i$ with $\mathit{lastEnd}[i] \le b.\mathit{from}$ and set $\mathit{lastEnd}[i] = b.\mathit{to}$.

**Theorem 2.** If $L(B) \le k$, EST never fails and returns a $k$-assignment. It uses exactly the berths $0, \dots, L(B)-1$. If $L(B) > k$, it fails. *[property test 2; `estRepack.test.ts`]*

*Proof.* We keep two invariants over the loop:

- (I1) $\mathit{lastEnd}[i]$ is the largest $\mathit{to}$ among bookings already on berth $i$ (0 if none);
- (I2) the bookings on each berth are pairwise non-overlapping.

Both hold initially. Consider the step for booking $b$ and let $U = \{i : \mathit{lastEnd}[i] > b.\mathit{from}\}$ be the busy berths. For $i \in U$ let $z_i$ be the booking on berth $i$ with $z_i.\mathit{to} = \mathit{lastEnd}[i]$. Because $z_i$ was processed before $b$, $z_i.\mathit{from} \le b.\mathit{from}$; and $z_i.\mathit{to} > b.\mathit{from}$. So $z_i$ covers segment $b.\mathit{from}$. Distinct berths give distinct bookings, and $b$ covers $b.\mathit{from}$ too, so

$$|U| + 1 \le \mathrm{load}_B(b.\mathit{from}) \le L(B).$$

Hence at most $L(B)-1$ of the berths $0, \dots, L(B)-1$ are busy, and the lowest free berth $i$ has index at most $L(B) - 1 \le k - 1$. Every booking $y$ already on berth $i$ has $y.\mathit{to} \le \mathit{lastEnd}[i] \le b.\mathit{from}$ by (I1), so $y \prec b$ and (I2) is kept. The new maximum end on berth $i$ is $b.\mathit{to}$, since $b.\mathit{to} > b.\mathit{from} \ge \mathit{lastEnd}[i]$, so (I1) is kept.

At the end, (I2) says the result is a $k$-assignment, using only berths below $L(B)$. It uses all of them, because the $L(B)$ bookings on a busiest segment need distinct berths. If $L(B) > k$, no $k$-assignment exists (Theorem 1), so EST must fail somewhere; the implementation throws there. ∎

**Proposition 2.1 (First-fit on start-sorted arrivals is optimal).** If requests arrive in non-decreasing order of $\mathit{from}$ (any order among equal $\mathit{from}$), unbounded First-fit opens exactly $L(B) = \omega$ berths. *[`unbounded.test.ts`]*

*Proof.* Take the moment $b$ arrives and a booking $y$ already on some berth; $y.\mathit{from} \le b.\mathit{from}$. If $y$ overlaps $b$ then $y.\mathit{to} > b.\mathit{from}$, so $y$ covers segment $b.\mathit{from}$. Conversely, if $y$ covers $b.\mathit{from}$ it overlaps $b$. So a berth is free for $b$ iff none of its bookings covers $b.\mathit{from}$. The berths not free for $b$ therefore each hold a distinct booking covering $b.\mathit{from}$, which gives at most $L(B) - 1$ of them. So First-fit never needs a berth numbered $L(B)$ or higher, and it opens at most $L(B)$ berths. At least $L(B)$ are needed by Theorem 1. ∎

---

## 4. Theorem 3 (Algorithm 4.5 is optimal)

Algorithm 4.5 (SPEC 4.5): sort $B$ as $b_1, \dots, b_m$ by $(\mathit{from}, \mathit{to}, \mathit{id})$. Keep a set $K$, initially empty. At step $t$, add $b_t$ to $K$; let $q_t = b_t.\mathit{from}$ and $A_t = \{x \in K : x \text{ covers } q_t\}$. If $|A_t| > k$, remove from $K$ the $x \in A_t$ with the largest $\mathit{to}$ (ties: largest id).

Write $K_t$ for $K$ after step $t$, $P_t = \{b_1, \dots, b_t\}$, and $R_t = P_t \setminus K_t$ for the bookings **evicted** by step $t$. Evicted bookings never return, so $R_1 \subseteq R_2 \subseteq \dots$, and $P_t = K_t \sqcup R_t$. A set $S$ is **feasible** if $L(S) \le k$; it is **optimal** if it is feasible of maximum size.

**Lemma 3.1 (the kept set is always feasible; one eviction suffices).** For every $t$, $K_t$ is feasible. At step $t$, $|A_t| \le k+1$, and one eviction happens exactly when $|A_t| = k+1$.

*Proof.* By induction; $K_0 = \emptyset$ is feasible. Assume $K_{t-1}$ is feasible and add $b = b_t$. Only segments $j \in [q_t, b.\mathit{to})$ gain load. Take such a $j$ and any $x \in K_{t-1}$ covering $j$. Then $x$ was processed before $b$, so $x.\mathit{from} \le q_t \le j < x.\mathit{to}$, and $x$ also covers $q_t$. Hence the bookings of $K_{t-1} \cup \{b\}$ covering $j$ form a subset of $A_t$. Because $K_{t-1}$ is feasible, at most $k$ of its bookings cover $q_t$, so $|A_t| \le k+1$. If $|A_t| \le k$ every such $j$ has load at most $k$ and nothing is evicted. If $|A_t| = k + 1$, evicting one $x \in A_t$ leaves at most $|A_t \setminus \{x\}| = k$ bookings covering each such $j$. Other segments did not gain load. ∎

(This is the precise form of SPEC 4.5's remark that checking only at $b.\mathit{from}$ suffices.)

**Theorem 3.** $K_m$ is optimal: $|K_m| = \max\{|S| : S \subseteq B,\ L(S) \le k\}$. *[property test 3: equal to brute force over all subsets]*

*Proof.* We show by induction on $t$:

> (★) there is an optimal set $O$ with $O \cap R_t = \emptyset$.

For $t = 0$, $R_0 = \emptyset$ and any optimal set works. Assume (★) for $t-1$ with optimal $O$, and consider step $t$. If nothing is evicted, $R_t = R_{t-1}$ and $O$ still works. Otherwise $|A_t| = k+1$ and $x$ is evicted, where $x \in A_t$ has the largest $\mathit{to}$ in $A_t$. If $x \notin O$, again $O$ works. So suppose $x \in O$.

The $k+1$ bookings of $A_t$ all cover $q_t$ and $O$ is feasible, so some $y \in A_t$ is not in $O$. Let $O' = (O \setminus \{x\}) \cup \{y\}$. Clearly $|O'| = |O|$. Also $O'$ avoids $R_t = R_{t-1} \cup \{x\}$: $x$ was removed, and $y$ has not been evicted (it is in $A_t \subseteq K_{t-1} \cup \{b_t\}$). It remains to show $O'$ is feasible, one segment $j$ at a time.

- **$j \ge q_t$.** If $y$ covers $j$ then $q_t \le j < y.\mathit{to} \le x.\mathit{to}$, and $x.\mathit{from} \le q_t$ because $x$ covers $q_t$. So $x$ covers $j$ as well. Swapping $x$ for $y$ therefore does not raise the load at $j$.
- **$j < q_t$.** Every booking covering $j$ has $\mathit{from} \le j < q_t = b_t.\mathit{from}$, so it comes before $b_t$ in the sorted order and lies in $P_{t-1} = K_{t-1} \sqcup R_{t-1}$. $O$ avoids $R_{t-1}$, so the bookings of $O \setminus \{x\}$ covering $j$ lie in $K_{t-1}$. As for $y$: if $y = b_t$ it does not cover $j$; otherwise $y \in K_{t-1}$. Either way the bookings of $O'$ covering $j$ form a subset of the bookings of $K_{t-1}$ covering $j$, and there are at most $k$ of those (Lemma 3.1).

So $O'$ is optimal and satisfies (★) for $t$. At $t = m$: $O \cap R_m = \emptyset$ means $O \subseteq B \setminus R_m = K_m$. $K_m$ is feasible (Lemma 3.1) and at least as large as an optimal set, so it is optimal. ∎

**Remarks.**
1. The proof uses only $y.\mathit{to} \le x.\mathit{to}$ for $y \in A_t$, so the tie-break (largest id) affects only which optimal set is returned, not optimality.
2. The tempting invariant "some optimal set agrees with $K_t$ on $P_t$" is false: the algorithm may keep a booking and evict it later. For example, with $k = 1$ and requests $[0,3), [1,2), [2,4)$, it keeps $[0,3)$, then evicts it for $[1,2)$, then keeps $[2,4)$. That is why (★) talks about evicted bookings only.
3. The same greedy (keep bookings in start order; on overload drop the one ending last) appears in the literature on interval scheduling with $k$ machines (Carlisle & Lloyd 1995; Faigle & Nawijn 1995). **To verify during the literature review:** the exact statements in those papers. The proof above does not depend on them, and the brute-force cross-check enforces the result on every test run.
4. Running time as implemented: $O(m \log m)$ to sort plus $O(m^2)$ for the active-set scans. That is polynomial, and fast at the sizes used (about 300 requests).

---

## 5. Lemma 2 (RAC reduction)

**Model.** A coach has $k$ confirmed berths and $r$ RAC berths. An RAC berth may carry at most two passengers on any segment (they share a side-lower berth). Following SPEC 5.1, RAC berth $i$ is modelled as two unit **slots** $2i$ and $2i+1$, so the RAC pool is $2r$ unit places.

**Lemma 2.** For a set $R$ of bookings, the following are equivalent:
(a) $R$ can be placed on $r$ RAC berths with at most two passengers per berth on every segment;
(b) $L(R) \le 2r$;
(c) $R$ has a $2r$-assignment to slots.

Consequently, allocating the RAC pool is ordinary interval-graph colouring with $2r$ extra colours, and treating RAC berths as slots loses nothing.

*Proof.* (c ⇒ a): put the passengers of slots $2i$ and $2i+1$ on RAC berth $i$. On any segment each slot holds at most one passenger (overlapping bookings are in distinct slots), so the berth holds at most two. (a ⇒ b): on every segment each of the $r$ berths carries at most 2, so the load is at most $2r$. (b ⇒ c): Theorem 1 with $k = 2r$. ∎

**Corollary 2.1 (offline optimum with RAC).** A set $S$ can be split into confirmed passengers with a $k$-assignment and RAC passengers with a $2r$-assignment iff $L(S) \le k + 2r$. Hence Algorithm 4.5 with capacity $k + 2r$ gives the maximum number seated in total, and RAC does not change the polynomial-time complexity of the offline problem. *[`rac.test.ts`: Tier 3 with RAC equals the brute force at $k + 2r$]*

*Proof.* (⇒) On every segment the load of $S$ is its confirmed load ($\le k$, Theorem 1) plus its RAC load ($\le 2r$, Lemma 2). (⇐) Run EST on $S$ with $k + 2r$ places (Theorem 2). Call the passengers on places $0, \dots, k-1$ confirmed, and those on places $k, \dots, k+2r-1$ RAC, as slots $0, \dots, 2r-1$. Each part keeps the property that overlapping passengers are in distinct places, so each is a valid assignment of its pool. Optimality of the total then follows from Theorem 3. ∎

This EST split is what the engine uses for Tier 3 (`offlineAssignment` in `src/engine/rac.ts`).

**Remark (why SPEC 5.1's original split was changed; decision of 2026-09-25).** The original rule chose the confirmed passengers by running Algorithm 4.5 with capacity $k$ inside the optimal set. It can leave an RAC set that does not fit. For $k = r = 1$, $n = 4$ and requests $[3,4), [2,4), [1,4), [0,2), [1,3)$: all five fit in 3 places, 4.5 at capacity 1 confirms $[0,2)$ and $[3,4)$, and the remaining three all cover segment 2, which is more than $2r = 2$ slots. A valid split with the same confirmed count exists: confirm $[0,2), [2,4)$.

Worse, the most confirmed passengers possible and a fitting RAC set can be incompatible outright. Take $k = r = 1$, $n = 6$ and $S = \{[0,5), [1,2), [1,4), [2,3), [3,6), [4,5), [5,6)\}$, with $L(S) = 3$. The largest chain has 4 bookings, $\{[1,2), [2,3), [4,5), [5,6)\}$. But every chain of 4 leaves $[0,5), [1,4), [3,6)$ for RAC, and all three cover segment 3. The best split that fits confirms 3 (brute force). The EST split is always valid and keeps the primary metric, total seated, optimal. Its confirmed count, a secondary metric, is sometimes lower than the best valid split: about 9% of random small instances, by about one passenger.

---

## 6. Consequences used by the simulator

**Proposition 6.1 (Tier 2 never produces a strategy-induced rejection; charting always succeeds).** *[property test 5; `rac.test.ts`]*

*Proof.* Tier 2 accepts $b$ into the confirmed pool iff every segment of $b$ has confirmed load below $k$. After acceptance those segments have load at most $k$ and the others are unchanged, so the accepted confirmed set always has $L \le k$. The same holds for RAC with $2r$. Charting runs EST on each pool, which succeeds by Theorem 2. A request is rejected only when the confirmed pool has load $k$ on some segment of $b$ and (if $r > 0$) the RAC pool has load $2r$ on some segment of $b$. That is exactly the definition of **forced** (SPEC 6). ∎

**Proposition 6.2 (certificates are sound).** *[property test 6; `rac.test.ts`]*

- *Forced.* The pool holds $c$ passengers (its capacity) on segment $j$ of $b$'s journey, all covering $j$, and $b$ covers $j$ too. So $c+1$ pairwise-overlapping bookings would need distinct places among $c$, and no rearrangement of that pool could seat $b$ (pigeonhole). With RAC, both pools are full somewhere on $b$'s journey, so $b$ fits neither pool under any rearrangement.
- *Strategy-induced.* In the named pool with capacity $c$, every segment of $b$ carries fewer than $c$, and the pool itself has $L \le c$ elsewhere. So $L(\text{pool} \cup \{b\}) \le c$, and EST returns a seating that includes $b$ (Theorem 2). That seating is the witness. ∎

**Proposition 6.3 (Tier 3 is an upper bound, per instance).** For any strategy, the passengers it seats form a set $S$ with $L(S) \le k + 2r$ (Corollary 2.1, ⇒). So $|S|$ is at most the Tier 3 value (Theorem 3 at $k + 2r$). *[property test 4]* ∎

**Remark (no per-instance order between Tier 1 and Tier 2).** Tier 2 need not seat at least as many as Tier 1 on a given stream. With $k = 2$, $n = 4$ and the stream $[3,4), [1,2), [1,3), [2,4), [2,3), [3,4)$, First-fit rejects $[2,4)$ as strategy-induced, and that leaves room for $[2,3)$ and $[3,4)$: it seats 5. Deferred accepts $[2,4)$, fills segments 2 and 3, and must reject both: it seats 4. So fragmentation loss $S_2 - S_1$ is reported as a distribution over seeds, never asserted per instance (SPEC 4.1). *[`deferred.test.ts`]*
