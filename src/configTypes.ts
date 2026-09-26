import type { RemapRule } from "./remap";

export interface Config {
  allowlist?: string[];
  stripPrefix?: string;
  remap?: RemapRule[];
  exclude?: string[];
}
