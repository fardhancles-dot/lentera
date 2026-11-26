import type { InventoryItem, ShopItemKind } from '../types/rewards';

export interface InventoryGroup {
  kind: ShopItemKind;
  title: string;
  note: string;
  items: InventoryItem[];
}

const GROUPS: Omit<InventoryGroup, 'items'>[] = [
  {
    kind: 'heart_potion',
    title: 'Ramuan & Pemulihan',
    note: 'Pulihkan Hearts agar bisa lanjut belajar.',
  },
  {
    kind: 'streak_freeze',
    title: 'Perlindungan Streak',
    note: 'Lindungi Streak saat satu hari terlewat.',
  },
];

/** Keeps server order inside each category and hides empty groups. */
export function groupInventoryItems(items: InventoryItem[]): InventoryGroup[] {
  return GROUPS.map((group) => ({
    ...group,
    items: items.filter((item) => item.kind === group.kind),
  })).filter((group) => group.items.length > 0);
}

export function inventoryTotal(items: InventoryItem[]): number {
  return items.reduce((total, item) => total + Math.max(0, item.quantity), 0);
}
