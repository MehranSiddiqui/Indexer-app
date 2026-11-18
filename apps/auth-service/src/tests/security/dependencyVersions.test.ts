import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// Guards the locked versions of packages bumped for security advisories.
const LOCKFILE = join(dirname(fileURLToPath(import.meta.url)), "../../../../../pnpm-lock.yaml");
const PATCHED = {
  axios: "1.20.0",
  "body-parser": "2.4.0",
  "brace-expansion": "5.0.11",
  "deepmerge-ts": "8.0.0",
  "fast-uri": "3.1.6",
  "follow-redirects": "1.16.1",
  mysql2: "3.22.0",
  pnpm: "11.11.0",
  postcss: "8.5.18",
  "proxy-addr": "2.0.8",
  "source-map-js": "1.2.2",
  tinypool: "2.1.2",
  vite: "7.3.7",
  zod: "4.6.6",
};

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

describe("locked dependency versions", () => {
  for (const [name, minimum] of Object.entries(PATCHED)) {
    it(`resolves ${name} to at least ${minimum}`, () => {
      const versions = resolved(name).filter((v) => parts(v)[0] === parts(minimum)[0]);
      expect(versions.length).toBeGreaterThan(0);
      for (const version of versions) {
        expect(compare(version, minimum), `${name}@${version} is below ${minimum}`)
          .toBeGreaterThanOrEqual(0);
      }
    });
  }
});
