# Solution for Issue #19

## 🛠️ Proposed Solution (by Aditya Waghamare)

### Analysis
The current implementation of `stripPrefix` only allows stripping a single prefix string from destination paths inside a pack. To support complex project layouts (e.g., monorepos or repositories where config, tests, and source code do not share a common root directory), we generalise `stripPrefix` into `remap`. 

Key requirements:
- `remap` accepts an ordered array of `{ from, to }` mappings (first match wins).
- `stripPrefix: "foo/"` serves as syntactic sugar for `remap: [{ from: "foo/", to: "" }]`.
- Configured values (`from` and `to`) as well as post-remapped destination paths are strictly validated for path traversal.
- Unmatched `from` rules raise a hard error.
- Destination path collisions trigger an error naming both original source paths.
- `MANIFEST.json` records final, remapped destination paths.

---

### Fix

1. **`src/config.mjs`**:
   - Added `'remap'` to `KNOWN_KEYS`.
   - Added validation for `remap` items: checking string types, enforcing traversal prevention on both `from` and `to` inputs.
   - Normalized legacy `stripPrefix` into `remap: [{ from: stripPrefix, to: "" }]` when `remap` is absent.

2. **`src/pack.mjs`**:
   - Updated path transformation logic to iterate over `remap` rules sequentially (first match wins).
   - Added path traversal verification on calculated destination paths.
   - Kept track of rule usage to ensure every configured `from` path matches at least one file.
   - Reinforced collision detection to report both colliding source file paths.
   - Written updated destination paths into `MANIFEST.json`.

3. **Init Template & README**:
   - Added `remap` example to `sparepack init` template and updated documentation in `README.md`.

---

### Implementation

#### 1. `src/config.mjs`
```javascript
import path from 'node.path';

export const KNOWN_KEYS = [
  'name',
  'version',
  'files',
  'output',
  'stripPrefix',
  'remap'
];

/**
 * Validates that a path string does not attempt path traversal or use absolute paths.
 * @param {string} p 
 * @param {string} label 
 */
function validateNoTraversal(p, label) {
  if (typeof p !== 'string') {
    throw new Error(`Invalid type for ${label}: expected string.`);
  }
  const normalized = path.normalize(p);
  if (path.isAbsolute(p) || normalized.startsWith('..') || normalized.includes('../') || normalized.includes('..\\')) {
    throw new Error(`Path traversal rejected in ${label}: "${p}"`);
  }
}

/**
 * Validates and normalizes configuration.
 * @param {Object} config 
 * @returns {Object} Normalized config
 */
export function validateConfig(config) {
  if (!config || typeof config !== 'object') {
    throw new Error('Invalid configuration: expected an object.');
  }

  // Check unknown keys
  for (const key of Object.keys(config)) {
    if (!KNOWN_KEYS.includes(key)) {
      throw new Error(`Unknown configuration key: "${key}"`);
    }
  }

  let remap = [];

  if (config.remap !== undefined) {
    if (!Array.isArray(config.remap)) {
      throw new Error('Configuration "remap" must be an array.');
    }
    remap = config.remap.map((rule, idx) => {
      if (!rule || typeof rule !== 'object') {
        throw new Error(`Invalid remap rule at index ${idx}: must be an object with "from" and "to"`);
      }
      const from = rule.from;
      const to = rule.to ?? '';

      validateNoTraversal(from, `remap[${idx}].from`);
      validateNoTraversal(to, `remap[${idx}].to`);

      return { from, to };
    });
  } else if (config.stripPrefix !== undefined) {
    if (typeof config.stripPrefix !== 'string') {
      throw new Error('Configuration "stripPrefix" must be a string.');
    }
    validateNoTraversal(config.stripPrefix, 'stripPrefix');
    remap = [{ from: config.stripPrefix, to: '' }];
  }

  return {
    ...config,
    remap
  };
}
```

#### 2. `src/pack.mjs`
```javascript
import path from 'node:path';
import fs from 'node:fs/promises';

/**
 * Apply remapping rules to source paths and build target pack entries.
 * @param {string[]} sourceFiles List of source file relative paths
 * @param {Array<{from: string, to: string}>} remapRules Ordered array of remap rules
 * @returns {Array<{ sourcePath: string, destPath: string }>}
 */
export function resolvePackEntries(sourceFiles, remapRules = []) {
  const matchedRules = new Set();
  const destToSource = new Map();
  const entries = [];

  for (const file of sourceFiles) {
    let destPath = file;
    
    // First match wins
    for (let i = 0; i < remapRules.length; i++) {
      const { from, to } = remapRules[i];
      if (file.startsWith(from)) {
        matchedRules.add(i);
        const remainder = file.slice(from.length);
        destPath = path.join(to, remainder);
        break;
      }
    }

    // Traversal rejection on calculated result
    const normalizedDest = path.normalize(destPath);
    if (path.isAbsolute(destPath) || normalizedDest.startsWith('..') || normalizedDest.includes('../') || normalizedDest.includes('..\\')) {
      throw new Error(`Path traversal rejected in calculated target path: "${destPath}" for source file "${file}"`);
    }

    // Collision detection
    if (destToSource.has(destPath)) {
      const existingSource = destToSource.get(destPath);
      throw new Error(`Collision detected: "${existingSource}" and "${file}" both map to "${destPath}"`);
    }

    destToSource.set(destPath, file);
    entries.push({ sourcePath: file, destPath });
  }

  // Ensure every configured `from` matched at least one source file
  remapRules.forEach((rule, idx) => {
    if (!matchedRules.has(idx)) {
      throw new Error(`remap rule 'from: "${rule.from}"' matched no files.`);
    }
  });

  return entries;
}

/**
 * Creates pack manifest and archive entries.
 */
export async function createPack(config, files) {
  const entries = resolvePackEntries(files, config.remap);
  
  // Construct MANIFEST.json with post-remap relative paths
  const manifest = {
    name: config.name,
    version: config.version,
    files: entries.map(e => e.destPath)
  };

  return {
    manifest,
    entries
  };
}
```

#### 3. `test/remap.test.mjs`
```javascript
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { validateConfig } from '../src/config.mjs';
import { resolvePackEntries } from '../src/pack.mjs';

describe('sparepack remap & stripPrefix features', () => {
  it('should accept and validate valid remap configuration', () => {
    const config = validateConfig({
      name: 'test-pack',
      remap: [
        { from: 'packages/api/src/', to: 'src/' },
        { from: 'packages/core/', to: '' }
      ]
    });
    assert.deepEqual(config.remap, [
      { from: 'packages/api/src/', to: 'src/' },
      { from: 'packages/core/', to: '' }
    ]);
  });

  it('should convert stripPrefix to equivalent remap rule', () => {
    const config = validateConfig({
      name: 'test-pack',
      stripPrefix: 'dist/'
    });
    assert.deepEqual(config.remap, [{ from: 'dist/', to: '' }]);
  });

  it('should apply multiple mappings with first-match-wins rule', () => {
    const rules = [
      { from: 'src/special/', to: 'override/' },
      { from: 'src/', to: 'lib/' }
    ];
    const files = ['src/special/index.js', 'src/common/util.js'];
    const entries = resolvePackEntries(files, rules);

    assert.deepEqual(entries, [
      { sourcePath: 'src/special/index.js', destPath: 'override/index.js' },
      { sourcePath: 'src/common/util.js', destPath: 'lib/util.js' }
    ]);
  });

  it('should reject traversal in remap configuration from/to', () => {
    assert.throws(() => {
      validateConfig({
        remap: [{ from: '../secret/', to: 'dist/' }]
      }), /Path traversal rejected/;
    });

    assert.throws(() => {
      validateConfig({
        remap: [{ from: 'src/', to: '../../etc/' }]
      }), /Path traversal rejected/;
    });
  });

  it('should reject traversal in calculated destination paths', () => {
    const rules = [{ from: 'src/', to: 'out/' }];
    const files = ['src/../../etc/passwd'];
    assert.throws(() => {
      resolvePackEntries(files, rules);
    }, /Path traversal rejected/);
  });

  it('should throw error when a remap from rule matches no files', () => {
    const rules = [{ from: 'nonexistent/', to: 'out/' }];
    const files = ['src/index.js'];
    assert.throws(() => {
      resolvePackEntries(files, rules);
    }, /matched no files/);
  });

  it('should detect collisions and report both source paths', () => {
    const rules = [
      { from: 'src/a/', to: 'dist/' },
      { from: 'src/b/', to: 'dist/' }
    ];
    const files = ['src/a/file.js', 'src/b/file.js'];
    assert.throws(() => {
      resolvePackEntries(files, rules);
    }, /Collision detected: "src\/a\/file.js" and "src\/b\/file.js" both map to "dist\/file.js"/);
  });
});
```

---

### Testing
1. Run `npm test` inside `sparepack` directory.
2. Verify existing tests pass and backwards compatibility for `stripPrefix` is maintained.
3. Validate path traversal rejections and collision errors with the test suite.

---
*Submitted by Aditya Waghamare*
💰 **Payout Address (Base L2 / EVM):** `0xb61dBcdBc3407F71EaCb64D4CBFAcf9FFfe2415C`