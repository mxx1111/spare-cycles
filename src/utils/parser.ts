export interface ParsedSparepack__packResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export const parse_sparepack__pack = <T = unknown>(s?: string | null): ParsedSparepack__packResult<T> => {
  if (!s || typeof s !== 'string' || !s.trim()) {
    return { success: false, error: 'Empty or invalid input payload' };
  }
  try {
    const parsed = JSON.parse(s.trim()) as T;
    return { success: true, data: parsed };
  } catch (err) {
    return { success: false, error: (err as Error).message || 'JSON Parse error' };
  }
};