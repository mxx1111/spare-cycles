import test from "node:test";
import assert from "node:assert";
import { applyRemap, validateRemap, detectCollision } from "../src/remap";

test("applyRemap with multiple rules and ordering (first-match-wins)", () => {
  const rules = [
    { from: "src/components", to: "components" },
    { from: "src", to: "lib" }
  ];

  assert.strictEqual(applyRemap("src/components/Button.ts", rules), "components/Button.ts");
  assert.strictEqual(applyRemap("src/index.ts", rules), "lib/index.ts");
});

test("validateRemap rejects rules containing traversal in from or to", () => {
  assert.throws(() => {
    validateRemap({ remap: [{ from: "../outside", to: "dist" }] });
  }, TypeError);

  assert.throws(() => {
    validateRemap({ remap: [{ from: "src", to: "../dist" }] });
  }, TypeError);
});

test("validateRemap rejects absolute paths", () => {
  assert.throws(() => {
    validateRemap({ remap: [{ from: "/absolute/path", to: "dist" }] });
  }, TypeError);
});

test("validateRemap rejects empty from", () => {
  assert.throws(() => {
    validateRemap({ remap: [{ from: "", to: "dist" }] });
  }, TypeError);
});

test("applyRemap throws on runtime traversal in computed destination", () => {
  const rules = [{ from: "src", to: "../escaped" }];
  assert.throws(() => {
    applyRemap("src/file.ts", rules);
  }, /Resulting path contains traversal segment/);
});

test("applyRemap throws when no rule matches", () => {
  const rules = [{ from: "lib", to: "dist" }];
  assert.throws(() => {
    applyRemap("src/file.ts", rules);
  }, /remap rule did not match any file/);
});

test("detectCollision reports both source paths", () => {
  const map = new Map<string, string>();
  detectCollision("output.ts", map, "src/a.ts");
  assert.throws(() => {
    detectCollision("output.ts", map, "src/b.ts");
  }, /Destination collision: both src\/a\.ts and src\/b\.ts map to output\.ts/);
});
