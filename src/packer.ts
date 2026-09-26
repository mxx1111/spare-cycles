import { applyRemap, detectCollision } from "./remap";
import type { Config } from "./configTypes";

export function processFiles(files: string[], config: Config): Record<string, string> {
  const destinationMap = new Map<string, string>();
  const result: Record<string, string> = {};

  const rules = config.remap && config.remap.length > 0
    ? config.remap
    : config.stripPrefix
      ? [{ from: config.stripPrefix, to: "" }]
      : [{ from: "", to: "" }];

  for (const file of files) {
    const destPath = applyRemap(file, rules);
    detectCollision(destPath, destinationMap, file);
    result[file] = destPath;
  }

  return result;
}
