export interface AppDef {
  id: string; icon: string; color: string; light: string; shadow: string;
}

/** Shared props interface for every calculator component */
export interface CalcProps {
  history: string[];
  onAdd: (id: string, entry: string) => void;
  onClear?: (id: string) => void;
}

/**
 * Active apps shown on the Home screen.
 * Only 4 calculator tools are live right now — Maternity Benefit,
 * Final Settlement, Share File (Drive link share) and Wages Grid.
 * "call" (Video Call) is a separate live utility, not one of the 4
 * calculators, kept alongside them.
 *
 * Retired calculators (EMI, VAT, BMI, Age, Garments suite, Unit
 * Converter, BD Land/Weight, Deposit, Zakat, Inheritance, Income Tax,
 * Utility Bill, Diet Chart, Stock Market, General/Scientific) have been
 * fully removed from the codebase rather than left commented out —
 * their components, imports, translations and nav entries are gone.
 * To bring one back, restore it from version control history.
 */
export const APPS: AppDef[] = [
  { id: 'maternity',       icon: 'FaBaby',         color: '#ec4899', light: '#1e0814', shadow: '#ec489920' },
  { id: 'finalsettlement', icon: 'FaFileContract', color: '#0d9488', light: '#071615', shadow: '#0d948820' },
  { id: 'driveshare',      icon: 'FaGoogleDrive',  color: '#0ea5e9', light: '#051a20', shadow: '#0ea5e920' },
  { id: 'wagesgrid',       icon: 'FaIndustry',     color: '#b45309', light: '#1c0f04', shadow: '#b4530920' },
  { id: 'call',            icon: 'FaVideo',        color: '#06b6d4', light: '#04181c', shadow: '#06b6d420' },
];
