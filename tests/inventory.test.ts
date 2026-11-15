import { describe, expect, it } from 'vitest';
import type { InventoryItem } from '../src/types/rewards';
import { groupInventoryItems, inventoryTotal } from '../src/utils/inventory';

function item(patch: Partial<InventoryItem>): InventoryItem {
  return {
    id: 'item-1',
    slug: 'item',
    name: 'Item',
    description: 'Deskripsi item.',
    kind: 'heart_potion',
    quantity: 1,
    maxStack: 3,
    icon: 'heart',
    ...patch,
  };
}

describe('inventory grouping', () => {
  it('groups owned items by kind and keeps server order inside a group', () => {
    const potion = item({ id: 'potion', kind: 'heart_potion', quantity: 2 });
    const shield = item({ id: 'shield', kind: 'streak_freeze', quantity: 1 });
    const secondPotion = item({ id: 'potion-2', kind: 'heart_potion', quantity: 3 });

    const groups = groupInventoryItems([potion, shield, secondPotion]);

    expect(groups.map((group) => group.kind)).toEqual(['heart_potion', 'streak_freeze']);
    expect(groups[0]?.items.map((entry) => entry.id)).toEqual(['potion', 'potion-2']);
    expect(groups[1]?.items.map((entry) => entry.id)).toEqual(['shield']);
  });

  it('hides empty categories and sums quantities for the Tas summary', () => {
    const items = [
      item({ id: 'potion', quantity: 2 }),
      item({ id: 'potion-2', quantity: 3 }),
    ];

    expect(groupInventoryItems(items)).toHaveLength(1);
    expect(inventoryTotal(items)).toBe(5);
    expect(groupInventoryItems([])).toEqual([]);
    expect(inventoryTotal([])).toBe(0);
  });
});
