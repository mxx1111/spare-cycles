# Solution for Issue #19

## 🛠️ Proposed Solution (by Aditya Waghamare)

### Analysis
`stripPrefix` only allows stripping a single leading directory prefix from destination paths. Generalising `stripPrefix` into `remap` supports multiple ordered prefix replacement rules (`{ from, to }`) so complex repo layouts (e.g. monorepos or repos with separate src, test, and config paths) can be remapped into a clean package structure.

### Fix
1. Register `remap` in `KNOWN_KEYS` in `src/config.mjs` and validate its structural syntax.
2. Treat `stripPrefix: "prefix"` as syntactic sugar for `remap: [{ from: "prefix", to: "" }]`.
3. Validate path traversal on configured `from` and `to` values as well as resulting destination paths.
4. Process mapping rules in order (first match wins).
5. Detect and error if any configured `from` rule matches zero files.
6. Detect collisions when multiple source files map to the same destination path, reporting both source paths in the error message.
7. Update `MANIFEST.json` generation and pack templates to use post-remap paths.

### Implementation

#### 1. Configuration Validation (`src/config.mjs`)
```javascript
import path from 'node:path';

export const KNOWN_KEYS = new Set([
  'name',
  'version',
  'files',
  'ignore',
  'stripPrefix',
  'remap',
  'manifest'
]);

function isTraversalPath(p) {
  if (typeof p !== 'string') return true;
  const normalized = path.normalize(p).replace(/\\/g, '/');
  return normalized.startsWith('../') || normalized === '..' || path.isAbsolute(p);
}

export function validateConfig(config) {
  for (const key of Object.keys(config)) {
    if (!KNOWN_KEYS.has(key)) {
      throw new Error(`Unknown config key: "${key}"`);
    }
  }

  let remapRules = [];

  if (config.remap !== undefined) {
    if (!Array.isArray(config.remap)) {
      throw new Error('Config property "remap" must be an array of {from, to} objects');
    }
    for (const rule of config.remap) {
      if (!rule || typeof rule !== 'object' || typeof rule.from !== 'string' || typeof rule.to !== 'string') {
        throw new Error('Each "remap" rule must be an object with string properties "from" and "to"');
      }
      if (isTraversalPath(rule.from)) {
        throw new Error(`Path traversal detected in remap "from" setting: "${rule.from}"`);
      }
      if (isTraversalPath(rule.to)) {
        throw new Error(`Path traversal detected in remap "to" setting: "${rule.to}"`);
      }
    }
    remapRules = config.remap;
  } else if (config.stripPrefix !== undefined) {
    if (typeof config.stripPrefix !== 'string') {
      throw new Error('Config property "stripPrefix" must be a string');
    }
    if (isTraversalPath(config.stripPrefix)) {
      throw new Error(`Path traversal detected in stripPrefix setting: "${config.stripPrefix}"`);
    }
    remapRules = [{ from: config.stripPrefix, to: '' }];
  }

  return {
    ...config,
    remapRules
  };
}
```

#### 2. Path Remapping Logic (`src/remap.mjs`)
```javascript
import path from 'node:path';

function normalizePath(p) {
  return p.replace(/\\/g, '/');
}

export function applyRemap(fileList, remapRules) {
  if (!remapRules || remapRules.length === 0) {
    return fileList.map(src => ({ src, dest: normalizePath(src) }));
  }

  const usedRules = new Set();
  const destToSrcMap = new Map();
  const results = [];

  for (const src of fileList) {
    const normalizedSrc = normalizePath(src);
    let remappedDest = normalizedSrc;
    let matched = false;

    for (let i = 0; i < remapRules.length; i++) {
      const rule = remapRules[i];
      let fromPrefix = normalizePath(rule.from);
      if (fromPrefix && !fromPrefix.endsWith('/')) {
        fromPrefix += '/';
      }

      let toPrefix = normalizePath(rule.to);
      if (toPrefix && !toPrefix.endsWith('/') && toPrefix.length > 0) {
        toPrefix += '/';
      }

      if (fromPrefix === '' || normalizedSrc.startsWith(fromPrefix)) {
        matched = true;
        usedRules.add(i);
        const relative = fromPrefix ? normalizedSrc.slice(fromPrefix.length) : normalizedSrc;
        remappedDest = toPrefix + relative;
        break; // First match wins
      }
    }

    // Check traversal on resulting destination path
    const normalizedDest = path.normalize(remappedDest).replace(/\\/g, '/');
    if (normalizedDest.startsWith('../') || normalizedDest === '..' || path.isAbsolute(remappedDest)) {
      throw new Error(`Path traversal detected in remapped destination path: "${remappedDest}" (from "${src}")`);
    }

    // Check collisions
    if (destToSrcMap.has(remappedDest)) {
      const existingSrc = destToSrcMap.get(remappedDest);
      throw new Error(`Collision detected: both "${existingSrc}" and "${src}" remap to "${remappedDest}"`);
    }

    destToSrcMap.set(remappedDest, src);
    results.push({ src, dest: remappedDest });
  }

  // Ensure all configured `from` rules matched at least one file
  for (let i = 0; i < remapRules.length; i++) {
    if (!usedRules.has(i)) {
      throw new Error(`Remap rule with "from": "${remapRules[i].from}" did not match any files`);
    }
  }

  return results;
}
```

#### 3. Update `sparepack init` Template & Documentation
```markdown
# Configuration Schema Update (`sparepack.config.json`)

\`\`\`json
{
  "name": "my-package",
  "version": "1.0.0",
  "remap": [
    { "from": "packages/api/src/", "to": "src/" },
    { "from": "packages/shared/", "to": "shared/" }
  ]
}
\`\`\`
```

---

### Testing

Run unit & end-to-end tests:

```bash
npm test
```

#### Test Suite (`test/remap.test.mjs`)
- **Multiple mappings & ordering**: Verifies first-match-wins rule evaluation order.
- **`stripPrefix` compatibility**: Verifies legacy `stripPrefix` outputs byte-identical packs.
- **Collision detection**: Asserts error is thrown with both source paths when destination paths overlap.
- **Traversal checks**: Verifies rejection of `..` in `from`, `to`, and final destination path calculation.
- **No-match error**: Ensures configured `from` path with 0 matched files throws an explicit error.

### Attribution
Design by `@xusuxiang8` (sparepack#3). Path traversal validation on configured prefix values carried forward from `@rafaio1` (sparepack#2).

---
*Submitted by Aditya Waghamare*
💰 **Payout Address (Base L2 / EVM):** `0xb61dBcdBc3407F71EaCb64D4CBFAcf9FFfe2415C`