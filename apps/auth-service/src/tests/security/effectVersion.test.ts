import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// Guards the locked version of effect, which is bumped for
// GHSA-7589-6fvf-x4pw. It is a transitive dependency of @prisma/config,
// so there are no application call sites to exercise.
const LOCKFILE = join(dirname(fileURLToPath(import.meta.url)), "../../../../../pnpm-lock.yaml");
const MINIMUM = "3.22.1";

const lockfile = readFileSync(LOCKFILE, "utf8");
const parts = (version: string) => version.split("-")[0].split(".").map((p) => Number(p) || 0);

function compare(a: string, b: string): number {
  const [left, right] = [parts(a), parts(b)];
  for (let i = 0; i < 3; i += 1) {
    if ((left[i] ?? 0) !== (right[i] ?? 0)) return (left[i] ?? 0) - (right[i] ?? 0);
  }
  return 0;
}

function resolved(name: string): string[] {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`^ {2}${escaped}@([0-9][^:()\\s]*)`, "gm");
  return [...lockfile.matchAll(pattern)].map((match) => match[1]);
}

describe("locked effect version", () => {
  it(`resolves effect to at least ${MINIMUM}`, () => {
    const versions = resolved("effect");
    expect(versions.length).toBeGreaterThan(0);
    for (const version of versions) {
      expect(compare(version, MINIMUM), `effect@${version} is below ${MINIMUM}`)
        .toBeGreaterThanOrEqual(0);
    }
  });
});
