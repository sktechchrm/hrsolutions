type History = Record<string, string[]>;
const KEY = 'mario_calc_v3';
const MAX_ENTRIES = 50;

export const loadStorage = (): History => {
  try {
    const raw: History = JSON.parse(localStorage.getItem(KEY) || '{}');
    // Cap every key's array in case data was saved before the limit existed
    Object.keys(raw).forEach(k => {
      if (Array.isArray(raw[k])) {
        raw[k] = raw[k].slice(-MAX_ENTRIES);
      }
    });
    return raw;
  } catch { return {}; }
};
export const saveStorage = (d: History): void => {
  try { localStorage.setItem(KEY, JSON.stringify(d)); } catch {}
};
export const addEntry = (cur: History, id: string, entry: string): History => {
  const n = { ...cur, [id]: [...(cur[id] || []).slice(-(MAX_ENTRIES - 1)), entry] };
  saveStorage(n); return n;
};
export const clearEntries = (cur: History, id: string): History => {
  const n = { ...cur, [id]: [] }; saveStorage(n); return n;
};
