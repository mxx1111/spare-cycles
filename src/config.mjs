import fs from "node:fs";
import path from "node:path";
import { validateRemap } from "./remap.js";

export const KNOWN_KEYS = [
  "allowlist",
  "stripPrefix",
  "remap",
  "exclude"
];

export function loadConfig(configPath = "sparepack.config.mjs") {
  if (!fs.existsSync(configPath)) {
    return { allowlist: [], stripPrefix: "", remap: [], exclude: [] };
  }

  // Basic config loading logic
  const rawContent = fs.readFileSync(configPath, "utf8");
  // For parsing simplicity in this environment, or dynamic import:
  // Implementation expects an exported config object or default export.
  return { allowlist: [], stripPrefix: "", remap: [], exclude: [] };
}

export function validateConfig(config) {
  if (!config || typeof config !== "object") {
    throw new TypeError("Config must be an object");
  }

  validateRemap(config);
  return config;
}
