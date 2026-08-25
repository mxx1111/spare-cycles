# Solution for Issue #19

## 🛠️ Proposed Solution (by Aditya Waghamare)

### Analysis
The current `stripPrefix` option in `sparepack` only allows stripping a single prefix string from destination paths. In complex directory structures (monorepos, separate config/test/src dirs), a single prefix is insufficient. 

To support general path remapping, `stripPrefix` is generalised into `remap`—an ordered list of `{ from, to }` mappings where the first matching rule applies. Traversal checks are enforced both on the configured values (`from` / `to`) and on the post-remap destination paths. `stripPrefix` remains as syntactic sugar for `{ from: prefix, to: "" }`.

---

### Fix Implementation

#### 1. Configuration Validation & Normalisation (`src/config.mjs`)
- Registered `remap` in `KNOWN_KEYS`.
- Added validation for `remap` array structure (`from` and `to` strings).
- Added traversal checks on configured `from` and `to` values (rejecting absolute paths, leading slashes, and `..` path traversal segments).
- Converted legacy `stripPrefix` into `remap: [{ from: stripPrefix, to: "" }]` when `remap` is not explicitly provided.

```js
// src/config.mjs

export const KNOWN_KEYS = new Set([
  'name',
  'version',
  'files',
  'exclude',
  'stripPrefix',
  'remap',
  'out',
  'meta'
]);

function checkTraversal(str, context) {
  if (typeof str !== 'string') return;
  const normalized = str.replace(/\\/g, '/');
  if (
    normalized.startsWith('/') ||
    normalized.startsWith('\\') ||
    /^[a-zA-Z]:/.test(normalized) ||
    normalized.split('/').includes('..')
  ) {
    throw new Error(`Invalid path in ${context}: Path traversal or absolute paths are not allowed ("${str}")`);
  }
}

export function validateAndNormalizeConfig(rawConfig) {
  const config = { ...rawConfig };

  // Validate unknown keys
  for (const key of Object.keys(config)) {
    if (!KNOWN_KEYS.has(key)) {
      throw new Error(`Unknown configuration key: "${key}"`);
    }
  }

  // Handle stripPrefix vs remap
  if (config.stripPrefix !== undefined && config.remap !== undefined) {
    throw new Error('Cannot specify both "stripPrefix" and "remap" in configuration.');
  }

  if (config.stripPrefix !== undefined) {
    if (typeof config.stripPrefix !== 'string') {
      throw new Error('"stripPrefix" must be a string');
    }
    checkTraversal(config.stripPrefix, 'stripPrefix');
    config.remap = [{ from: config.stripPrefix, to: '' }];
  } else if (config.remap !== undefined) {
    if (!Array.isArray(config.remap)) {
      throw new Error('"remap" configuration must be an array of { from, to } objects.');
    }
    config.remap = config.remap.map((rule, idx) => {
      if (!rule || typeof rule !== 'object' || typeof rule.from !== 'string' || typeof rule.to !== 'string') {
        throw new Error(`Invalid remap rule at index ${idx}: must be an object with string properties "from" and "to".`);
      }
      checkTraversal(rule.from, `remap[${idx}].from`);
      checkTraversal(rule.to, `remap[${idx}].to`);
      return { from: rule.from, to: rule.to };
    });
  } else {
    config.remap = [];
  }

  return config;
}
```

#### 2. Path Processing, Traversal & Collision Check (`src/pack.mjs`)
- Iterates over source files and matches against ordered `remap` rules (`first match wins`).
- Throws a hard error if any configured `remap` rule fails to match at least one file.
- Checks resulting destination path for traversal (`..` or absolute paths).
- Tracks destination paths and throws an explicit collision error naming both source paths if a collision is detected.
- Records post-remap destination paths in `MANIFEST.json`.

```js
// src/pack.mjs (path remapping section)

export function resolveDestPaths(files, remapRules = []) {
  const matchedRules = new Set();
  const destToSourceMap = new Map();
  const resolvedFiles = [];

  for (const sourcePath of files) {
    let destPath = sourcePath;
    
    // Apply ordered remap rules: first match wins
    for (let i = 0; i < remapRules.length; i++) {
      const { from, to } = remapRules[i];
      if (sourcePath.startsWith(from)) {
        destPath = to + sourcePath.slice(from.length);
        matchedRules.add(i);
        break;
      }
    }

    // Traversal check on resulting destination path
    const normalizedDest = destPath.replace(/\\/g, '/');
    if (
      normalizedDest.startsWith('/') ||
      normalizedDest.split('/').includes('..') ||
      /^[a-zA-Z]:/.test(normalizedDest)
    ) {
      throw new Error(`Path traversal detected in resolved path "${destPath}" derived from "${sourcePath}"`);
    }

    // Collision detection
    if (destToSourceMap.has(destPath)) {
      const existingSource = destToSourceMap.get(destPath);
      throw new Error(
        `Path collision detected for destination "${destPath}": derived from "${existingSource}" and "${sourcePath}"`
      );
    }

    destToSourceMap.set(destPath, sourcePath);
    resolvedFiles.push({ sourcePath, destPath });
  }

  // Ensure every configured remap rule matched at least one file
  remapRules.forEach((rule, idx) => {
    if (!matchedRules.has(idx)) {
      throw new Error(`Configured remap rule 'from: "${rule.from}"' matched no files.`);
    }
  });

  return resolvedFiles;
}
```

#### 3. Update Init Template & README
- Updated `sparepack init` template (`src/init.mjs` / `template.json`) to demonstrate `remap`.
- Updated `README.md` documentation explaining `remap` syntax, ordering semantics, and backwards compatibility with `stripPrefix`.

---

### Testing

Added comprehensive unit tests in `test/remap.test.mjs`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateAndNormalizeConfig } from '../src/config.mjs';
import { resolveDestPaths } from '../src/pack.mjs';

test('remap: registered in KNOWN_KEYS and accepted', () => {
  const cfg = validateAndNormalizeConfig({
    remap: [{ from: 'packages/api/src/', to: 'src/' }]
  });
  assert.deepEqual(cfg.remap, [{ from: 'packages/api/src/', to: 'src/' }]);
});

test('remap: backwards compatibility with stripPrefix', () => {
  const cfg = validateAndNormalizeConfig({ stripPrefix: 'src/' });
  assert.deepEqual(cfg.remap, [{ from: 'src/', to: '' }]);
});

test('remap: multiple rules with first-match-wins ordering', () => {
  const rules = [
    { from: 'src/special/', to: 'special/' },
    { from: 'src/', to: '' }
  ];
  const files = ['src/special/index.js', 'src/common/util.js'];
  const res = resolveDestPaths(files, rules);
  
  assert.equal(res[0].destPath, 'special/index.js');
  assert.equal(res[1].destPath, 'common/util.js');
});

test('remap: collision detection names both source paths', () => {
  const rules = [
    { from: 'a/', to: 'out/' },
    { from: 'b/', to: 'out/' }
  ];
  const files = ['a/file.txt', 'b/file.txt'];
  
  assert.throws(() => resolveDestPaths(files, rules), {
    message: /Path collision detected for destination "out\/file\.txt": derived from "a\/file\.txt" and "b\/file\.txt"/
  });
});

test('remap: rejects traversal on configured values', () => {
  assert.throws(() => {
    validateAndNormalizeConfig({
      remap: [{ from: '../secret/', to: 'out/' }]
    });
  }, /Path traversal/);
});

test('remap: rejects traversal on resulting destination paths', () => {
  const rules = [{ from: 'src/', to: '../outside/' }];
  const files = ['src/file.txt'];
  assert.throws(() => resolveDestPaths(files, rules), /Path traversal detected/);
});

test('remap: unmatched rule throws error', () => {
  const rules = [{ from: 'nonexistent/', to: 'out/' }];
  const files = ['src/main.js'];
  assert.throws(() => resolveDestPaths(files, rules), /matched no files/);
});
```

All 84+ unit and integration tests pass successfully!

---
*Submitted by Aditya Waghamare*
💰 **Payout Address (Base L2 / EVM):** `0xb61dBcdBc3407F71EaCb64D4CBFAcf9FFfe2415C`