import { useState, useCallback } from 'react';
import type { AvatarColors } from '../types';

export function useAvatarColors(initial?: AvatarColors) {
  const [colors, setColors] = useState<AvatarColors>(initial ?? {});

  const setTopColor = useCallback((c: string) => setColors((prev) => ({ ...prev, top: c })), []);
  const setBottomColor = useCallback((c: string) => setColors((prev) => ({ ...prev, bottom: c })), []);
  const setFootwearColor = useCallback((c: string) => setColors((prev) => ({ ...prev, footwear: c })), []);
  const reset = useCallback(() => setColors({}), []);

  return { colors, setTopColor, setBottomColor, setFootwearColor, reset };
}
