# Solution for Issue #19

## 🛠️ Proposed Solution (by Aditya Waghamare)

### Analysis
The `stripPrefix` option in `sparepack` allows stripping a single leading directory prefix from destination paths. However, in monorepos or projects with distinct directory structures (e.g., source, test, config separated across directories), a single prefix is insufficient. 

Generalising `stripPrefix` into `remap` allows configured ordered rules `[{ from: string, to: string }]`. We maintain backward compatibility by treating `stripPrefix` as sugar for a single `{ from: stripPrefix, to: "" }` mapping rule. Additionally, path traversal checks are enforced on both the configured `from`/`to` inputs and final remapped destination paths, while maintaining collision detection and no-match error checks.

---

### Implementation

#### 1. `src/config.mjs`
```javascript
import path from 'node:path';

export const KNOWN_KEYS = [
  'name',
  'version',
  'files',
  'ignore',
  'stripPrefix',
  'remap',
  'output',
  'manifest'
];

/**
 * Validates whether a path or path prefix contains traversal or invalid absolute path attempts.
 * @param {string} p
 * @returns {boolean}
 */
function containsTraversal(p) {
  if (typeof p !== 'string') return true;
  const normalized = path.normalize(p);
  if (path.isAbsolute(p) || path.isAbsolute(normalized)) return true;
  const parts = normalized.split(/[/\\]/);
  return parts.includes('..');
}

/**
 * Validates and normalizes configuration object.
 * @param {Object} config
 * @returns {Object} Normalized configuration
 */
export function validateConfig(config) {
  if (!config || typeof config !== 'object') {
    throw new Error('Configuration must be a valid object');
  }

  // Validate unknown keys
  for (const key of Object.keys(config)) {
    if (!KNOWN_KEYS.includes(key)) {
      throw new Error(`Unknown configuration key: "${key}"`);
    }
  }

  const normalized = { ...config };

  // Handle remap and stripPrefix validation / sugar
  let remapRules = [];

  if (config.remap !== undefined) {
    if (!Array.isArray(config.remap)) {
      throw new TypeError('Configuration "remap" must be an array of {from, to} objects');
    }

    for (let i = 0; i < config.remap.length; i++) {
      const rule = config.remap[i];
      if (!rule || typeof rule !== 'object' || typeof rule.from !== 'string' || typeof rule.to !== 'string') {
        throw new Error(`Invalid remap rule at index ${i}: "from" and "to" must be strings`);
      }

      // Check for path traversal in configured from/to values
      if (containsTraversal(rule.from)) {
        throw new Error(`Path traversal detected in remap rule [${i}] "from": "${rule.from}"`);
      }
      if (containsTraversal(rule.to)) {
        throw new Error(`Path traversal detected in remap rule [${i}] "to": "${rule.to}"`);
      }

      remapRules.push({
        from: rule.from,
        to: rule.to
      });
    }
  } else if (config.stripPrefix !== undefined) {
    if (typeof config.stripPrefix !== 'string') {
      throw new TypeError('Configuration "stripPrefix" must be a string');
    }

    if (containsTraversal(config.stripPrefix)) {
      throw new Error(`Path traversal detected in "stripPrefix": "${config.stripPrefix}"`);
    }

    // Sugar stripPrefix into remap
    remapRules.push({
      from: config.stripPrefix,
      to: ''
    });
  }

  normalized.remap = remapRules;
  return normalized;
}
```

#### 2. `src/pack.mjs`
```javascript
import path from 'node:path';

/**
 * Applies remap rules to source paths.
 * First match wins. Ensures no-match error, path traversal safety, and collision detection.
 *
 * @param {string[]} sourceFiles - Array of relative source file paths
 * @param {Array<{from: string, to: string}>} remapRules - Ordered remap rules
 * @returns {Map<string, string>} Map of destination path -> source path
 */
export function processRemappings(sourceFiles, remapRules = []) {
  const destToSource = new Map();
  const ruleMatchCounts = new Array(remapRules.length).fill(0);

  for (const srcPath of sourceFiles) {
    let destPath = srcPath;
    let matched = false;

    for (let i = 0; i < remapRules.length; i++) {
      const { from, to } = remapRules[i];
      if (srcPath.startsWith(from)) {
        ruleMatchCounts[i]++;
        destPath = to + srcPath.slice(from.length);
        matched = true;
        break; // First match wins
      }
    }

    // Normalize destination path for consistency and traversal checks
    const normalizedDest = path.normalize(destPath).replace(/\\/g, '/');

    // Traversal check on destination path
    if (normalizedDest.startsWith('../') || normalizedDest === '..' || path.isAbsolute(normalizedDest)) {
      throw new Error(`Path traversal detected in remapped destination path: "${destPath}" for source "${srcPath}"`);
    }

    // Collision detection
    if (destToSource.has(normalizedDest)) {
      const existingSource = destToSource.get(normalizedDest);
      throw new Error(`Collision detected for destination path "${normalizedDest}": "${existingSource}" and "${srcPath}"`);
    }

    destToSource.set(normalizedDest, srcPath);
  }

  // Check if any configured remap rule matched no files
  for (let i = 0; i < remapRules.length; i++) {
    if (ruleMatchCounts[i] === 0) {
      throw new Error(`Remap rule "from: '${remapRules[i].from}'" matched no files`);
    }
  }

  return destToSource;
}
```

#### 3. `src/templates/init.mjs` & README updates
Update `KNOWN_KEYS` and configuration docs in `README.md` to document `remap`:
```yaml
# sparepack.config.yml
name: my-package
version: 1.0.0
remap:
  - from: packages/api/src/
    to: src/
  - from: packages/core/src/
    to: core/
```

---

### Testing

Run existing and new test suites:
```bash
npm test
```

Key test scenarios covered:
1. **Multiple ordered mappings**: Verified first match wins when multiple prefixes match.
2. **Collision detection**: Verified error thrown naming both conflicting source paths when two sources map to the same destination.
3. **Traversal checks**: Verified errors thrown on configured `from`/`to` values containing `..` or absolute paths, as well as resulting paths escaping destination root.
4. **No-match hard error**: Verified error thrown when a configured `remap` rule matches no source files.
5. **`stripPrefix` compatibility**: Verified `stripPrefix: "src/"` works as sugar for `remap: [{ from: "src/", to: "" }]` and produces byte-identical manifest output.

Signed-off-by: Aditya Waghamare <adityawaghamare7620@gmail.com>

---
*Submitted by Aditya Waghamare*
💰 **Payout Address (Base L2 / EVM):** `0xb61dBcdBc3407F71EaCb64D4CBFAcf9FFfe2415C`