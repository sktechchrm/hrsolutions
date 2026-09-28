import { useState, useCallback } from 'react';
import { loadStorage, addEntry, clearEntries } from '../utils/storage.ts';

type History = Record<string, string[]>;

export const useHistory = () => {
  const [history, setHistory] = useState<History>(loadStorage);
  const add = useCallback((id: string, entry: string) =>
    setHistory(p => addEntry(p, id, entry)), []);
  const clear = useCallback((id: string) =>
    setHistory(p => clearEntries(p, id)), []);
  return { history, add, clear };
};
