import { applyRemap, type RemapRule } from "./remap";

export function stripPrefix(filePath: string, prefix: string): string {
  if (!prefix) {
    return filePath;
  }
  const rule: RemapRule = { from: prefix, to: "" };
  return applyRemap(filePath, [rule]);
}
