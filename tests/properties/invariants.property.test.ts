import { describe, it } from 'vitest';

describe('invariants (fast-check, >= 500 runs each)', () => {
  it.todo('1. no double-booking in any final assignment');
  it.todo('2. Theorem 1: estRepack succeeds iff peakLoad <= k');
  it.todo('3. offline optimum seated equals brute force');
  it.todo('4. Tier 3 seated >= every Tier 1 strategy and Tier 2');
  it.todo('5. Tier 2 has zero strategy-induced rejections');
  it.todo('6. certificates are sound');
  it.todo('7. identical inputs and seed give identical RunResult');
});
