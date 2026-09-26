import path from "node:path";

export type RemapRule = {
  from: string;
  to: string;
};

export function normalizePrefix(p: string): string {
  if (!p) return "";
  const normalized = path.posix.normalize(p);
  return normalized.replace(/\/+$/, "");
}

export function hasPathTraversalSegment(p: string): boolean {
  const normalized = path.posix.normalize(p);
  const segments = normalized.split("/");
  return segments.includes("..");
}

export function assertValidRule(rule: RemapRule, index: number): void {
  if (!rule || typeof rule !== "object") {
    throw new TypeError(`Remap rule at index ${index} must be an object`);
  }
  if (typeof rule.from !== "string" || rule.from.trim() === "") {
    throw new TypeError(`Remap rule at index ${index} must have a non-empty string "from" property`);
  }
  if (typeof rule.to !== "string") {
    throw new TypeError(`Remap rule at index ${index} must have a string "to" property`);
  }

  if (path.posix.isAbsolute(rule.from) || path.win32.isAbsolute(rule.from)) {
    throw new TypeError(`Remap rule at index ${index} has absolute "from" path: ${rule.from}`);
  }
  if (path.posix.isAbsolute(rule.to) || path.win32.isAbsolute(rule.to)) {
    throw new TypeError(`Remap rule at index ${index} has absolute "to" path: ${rule.to}`);
  }

  if (hasPathTraversalSegment(rule.from)) {
    throw new TypeError(`Remap rule at index ${index} has traversal segment in "from": ${rule.from}`);
  }
  if (hasPathTraversalSegment(rule.to)) {
    throw new TypeError(`Remap rule at index ${index} has traversal segment in "to": ${rule.to}`);
  }
}

export function validateRemap(config: any): void {
  if (config.remap === undefined) {
    return;
  }
  if (!Array.isArray(config.remap)) {
    throw new TypeError("Configuration 'remap' must be an array of rules");
  }
  config.remap.forEach((rule: RemapRule, index: number) => {
    assertValidRule(rule, index);
  });
}

export function applyRemap(filePath: string, rules: RemapRule[]): string {
  const normalizedPath = path.posix.normalize(filePath);
  
  for (const rule of rules) {
    const normFrom = normalizePrefix(rule.from);
    const normTo = normalizePrefix(rule.to);

    if (normalizedPath === normFrom) {
      const result = normTo;
      if (hasPathTraversalSegment(result)) {
        throw new Error("Resulting path contains traversal segment");
      }
      return result;
    }

    if (normFrom && normalizedPath.startsWith(normFrom + "/")) {
      const remainder = normalizedPath.slice(normFrom.length + 1);
      const result = normTo ? `${normTo}/${remainder}` : remainder;
      if (hasPathTraversalSegment(result)) {
        throw new Error("Resulting path contains traversal segment");
      }
      return result;
    }
  }

  throw new Error(`remap rule did not match any file: ${filePath}`);
}

export function detectCollision(dest: string, map: Map<string, string>, sourcePath?: string): void {
  if (map.has(dest)) {
    const existing = map.get(dest);
    if (sourcePath && existing) {
      throw new Error(`Destination collision: both ${existing} and ${sourcePath} map to ${dest}`);
    }
    throw new Error(`Destination collision: multiple files map to ${dest}`);
  }
  if (sourcePath) {
    map.set(dest, sourcePath);
  }
}
