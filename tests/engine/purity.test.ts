// Guards the CLAUDE.md rules: the engine is pure, and no explicit `any` anywhere in src.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

function sources(dir: string): { path: string; text: string }[] {
  return readdirSync(dir, { recursive: true, encoding: 'utf8' })
    .filter((f) => /\.tsx?$/.test(f))
    .map((f) => ({ path: join(dir, f), text: readFileSync(join(dir, f), 'utf8') }));
}

describe('source rules', () => {
  it('engine has no clock, Math.random, React, DOM or UI imports', () => {
    const banned = /Math\.random|Date\.now|new Date\(|from ['"]react|\/ui\/|\bdocument\.|\bwindow\./;
    const hits = sources('src/engine').filter((s) => banned.test(s.text)).map((s) => s.path);
    expect(hits).toEqual([]);
  });

  it('no explicit any in src', () => {
    const anyType = /:\s*any\b|\bas any\b|<any>/;
    const hits = sources('src').filter((s) => anyType.test(s.text)).map((s) => s.path);
    expect(hits).toEqual([]);
  });
});
