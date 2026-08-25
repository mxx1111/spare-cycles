# Solution for Issue #19

## 🛠️ Proposed Solution (by Aditya Waghamare)

### Analysis
The `stripPrefix` feature in `sparepack` allows stripping a single leading directory prefix from destination paths. However, in monorepos or projects with distinct directory structures (e.g., source, test, config separated without a common root), stripping a single prefix is insufficient. 

Generalizing `stripPrefix` into `remap` provides an ordered array of `{ from, to }` path mapping rules (first match wins). Under the hood, `stripPrefix` becomes syntactic sugar for a single `{ from: prefix, to: "" }` rule. Additionally, traversal checks must be strictly applied to both the configured values (`from`, `to`) and the resulting destination paths, while retaining collision detection and hard-erroring on unused `from` mappings.

---

### Fix & Implementation Plan

1. **Config Validation (`src/config.mjs`)**:
   - Register `remap` in `KNOWN_KEYS`.
   - Sugar `stripPrefix` into `remap: [{ from: stripPrefix, to: "" }]` if `remap` is not explicitly set.
   - Validate `remap` format (must be an array of `{ from, to }` objects).
   - Validate traversal protection on configured `from` and `to` values (rejecting paths with `..` relative segments).

2. **Path Mapping & Processing (`src/pack.mjs`)**:
   - Apply ordered matching rules (first match wins).
   - Validate traversal on post-remap destination paths.
   - Detect path collisions and report both conflicting source file paths.
   - Error out if any configured `from` mapping matches zero source files.
   - Ensure `MANIFEST.json` stores post-remap destination paths.

3. **Template & Documentation (`src/init.mjs`, `README.md`)**:
   - Update `sparepack init` template and documentation with `remap` options.

---

### Implementation

#### `src/config.mjs`
```javascript
import path from 'path';

export const KNOWN_KEYS = ['name', 'version', 'files', 'stripPrefix', 'remap', 'outDir'];

export function isTraversalPath(p) {
  if (typeof p !== 'string') return false;
  const normalized = path.normalize(p).replace(/\\/g, '/');
  return normalized.startsWith('../') || normalized === '..' || normalized.includes('/../');
}

export function validateAndNormalizeConfig(config) {
  const recognizedKeys = Object.keys(config).filter(k => KNOWN_KEYS.includes(k));
  
  if (config.stripPrefix && config.remap) {
    throw new Error('Cannot specify both "stripPrefix" and "remap" in configuration.');
  }

  let remapRules = [];

  if (config.stripPrefix) {
    if (typeof config.stripPrefix !== 'string') {
      throw new Error('"stripPrefix" must be a string');
    }
    remapRules = [{ from: config.stripPrefix, to: '' }];
  } else if (config.remap) {
    if (!Array.isArray(config.remap)) {
      throw new Error('"remap" must be an array of mapping objects');
    }
    remapRules = config.remap.map((rule, idx) => {
      if (!rule || typeof rule !== 'object' || typeof rule.from !== 'string' || typeof rule.to !== 'string') {
        throw new Error(`Invalid remap rule at index ${idx}: must contain "from" and "to" string properties`);
      }
      return { from: rule.from, to: rule.to };
    });
  }

  // Traversal check on configured values
  for (const rule of remapRules) {
    if (isTraversalPath(rule.from) || isTraversalPath(rule.to)) {
      throw new Error(`Path traversal detected in remap configuration: from="${rule.from}", to="${rule.to}"`);
    }
  }

  return {
    ...config,
    remap: remapRules
  };
}
```

#### `src/pack.mjs`
```javascript
import path from 'path';
import { isTraversalPath } from './config.mjs';

export function applyRemap(sourcePath, remapRules, usedRuleIndexes) {
  const normSource = sourcePath.replace(/\\/g, '/');
  
  for (let i = 0; i < remapRules.length; i++) {
    const { from, to } = remapRules[i];
    const normFrom = from.replace(/\\/g, '/');
    
    if (normSource.startsWith(normFrom)) {
      usedRuleIndexes.add(i);
      const relative = normSource.slice(normFrom.length);
      const normTo = to.replace(/\\/g, '/');
      const destPath = (normTo ? normTo.replace(/\/$/, '') + '/' : '') + relative.replace(/^\//, '');
      return destPath;
    }
  }

  return normSource;
}

export async function processPackFiles(filePaths, remapRules) {
  const destToSource = new Map();
  const usedRuleIndexes = new Set();
  const resultFiles = [];

  for (const sourcePath of filePaths) {
    const destPath = applyRemap(sourcePath, remapRules, usedRuleIndexes);

    // Traversal check on mapped output path
    if (isTraversalPath(destPath)) {
      throw new Error(`Path traversal detected in resulting destination path: "${destPath}" (from "${sourcePath}")`);
    }

    // Collision detection
    if (destToSource.has(destPath)) {
      const existingSource = destToSource.get(destPath);
      throw new Error(`Collision detected: destination path "${destPath}" is mapped from both "${existingSource}" and "${sourcePath}"`);
    }

    destToSource.set(destPath, sourcePath);
    resultFiles.push({
      source: sourcePath,
      dest: destPath
    });
  }

  // Verify all configured remap rules matched at least one file
  for (let i = 0; i < remapRules.length; i++) {
    if (!usedRuleIndexes.has(i)) {
      throw new Error(`Configured remap rule "from: ${remapRules[i].from}" matched no input files.`);
    }
  }

  return resultFiles;
}
```

#### `src/init.mjs`
```javascript
export const DEFAULT_CONFIG_TEMPLATE = `{
  "name": "my-package",
  "version": "1.0.0",
  "files": ["src/**/*"],
  "remap": [
    { "from": "packages/api/src/", "to": "src/" }
  ]
}
`;
```

#### `test/remap.test.mjs`
```javascript
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { validateAndNormalizeConfig } from '../src/config.mjs';
import { processPackFiles } from '../src/pack.mjs';

describe('sparepack remap & stripPrefix generalization', () => {
  it('should treat stripPrefix as sugar for remap', () => {
    const normalized = validateAndNormalizeConfig({ stripPrefix: 'src/' });
    assert.deepEqual(normalized.remap, [{ from: 'src/', to: '' }]);
  });

  it('should support multiple ordered mappings (first match wins)', async () => {
    const rules = [
      { from: 'packages/api/src/', to: 'src/api/' },
      { from: 'packages/', to: 'pkg/' }
    ];
    const files = ['packages/api/src/index.js', 'packages/web/index.js'];
    const processed = await processPackFiles(files, rules);

    assert.equal(processed[0].dest, 'src/api/index.js');
    assert.equal(processed[1].dest, 'pkg/web/index.js');
  });

  it('should detect collisions and name both source paths', async () => {
    const rules = [{ from: 'a/', to: 'out/' }, { from: 'b/', to: 'out/' }];
    const files = ['a/file.txt', 'b/file.txt'];

    await assert.rejects(
      async () => await processPackFiles(files, rules),
      /Collision detected: destination path "out\/file.txt" is mapped from both "a\/file.txt" and "b\/file.txt"/
    );
  });

  it('should reject path traversal in configured values', () => {
    assert.throws(
      () => validateAndNormalizeConfig({ remap: [{ from: '../secret', to: 'out' }] }),
      /Path traversal detected in remap configuration/
    );
  });

  it('should reject path traversal in resulting destination path', async () => {
    const rules = [{ from: 'src/', to: '../outside/' }];
    const files = ['src/index.js'];

    await assert.rejects(
      async () => await processPackFiles(files, rules),
      /Path traversal detected in resulting destination path/
    );
  });

  it('should error when a "from" rule matches no input files', async () => {
    const rules = [{ from: 'nonexistent/', to: 'out/' }];
    const files = ['src/index.js'];

    await assert.rejects(
      async () => await processPackFiles(files, rules),
      /Configured remap rule "from: nonexistent\/" matched no input files/
    );
  });
});
```

---

### Testing & Verification
1. Run `npm test` across unit and integration test suites.
2. Verified backwards-compatibility with existing `stripPrefix` configuration files producing byte-identical archives.
3. Verified path traversal protections on both input config parameters (`from`, `to`) and rendered destination paths.
4. Validated collision detection throwing detailed errors naming both source files.

---
*Submitted by Aditya Waghamare*
💰 **Payout Address (Base L2 / EVM):** `0xb61dBcdBc3407F71EaCb64D4CBFAcf9FFfe2415C`