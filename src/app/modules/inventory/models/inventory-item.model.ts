export type ItemStatus = 'owned' | 'sold';
export type ItemCondition = 'new' | 'used' | 'refurbished';

export interface InventoryItem {
  readonly id: string;
  name: string;
  categoryId: string;
  purchasePrice: number;
  purchaseDate: string;          // ISO date (yyyy-mm-dd)
  currency: string;              // ISO 4217, e.g. 'USD'
  description?: string;
  brand?: string;
  condition?: ItemCondition;
  location?: string;             // physical storage hint, e.g. "Wardrobe shelf 2"
  tags?: readonly string[];

  pinned: boolean;
  status: ItemStatus;

  // sale info
  soldAt?: string;
  salePrice?: number;

  // engagement / usage stats
  useCount: number;              // incremented by the "Use" button
  lastUsedAt?: string;
  viewCount: number;             // incremented when item-detail is opened

  // audit
  createdAt: string;
  updatedAt: string;
}

/** Fields the user supplies when adding a new item. The store fills in
 *  id, audit timestamps, status='owned', pinned=false, and counters. */
export type NewInventoryItemInput = Pick<
  InventoryItem,
  'name' | 'categoryId' | 'purchasePrice' | 'purchaseDate' | 'currency'
> &
  Partial<
    Pick<InventoryItem, 'description' | 'brand' | 'condition' | 'location' | 'tags'>
  >;

export function profitOf(item: InventoryItem): number {
  if (item.status !== 'sold' || item.salePrice == null) return 0;
  return item.salePrice - item.purchasePrice;
}

export function roiOf(item: InventoryItem): number {
  if (item.status !== 'sold' || item.salePrice == null || item.purchasePrice <= 0) return 0;
  return ((item.salePrice - item.purchasePrice) / item.purchasePrice) * 100;
}

export function daysOwned(item: InventoryItem, until: Date = new Date()): number {
  const start = new Date(item.purchaseDate).getTime();
  const end = item.status === 'sold' && item.soldAt ? new Date(item.soldAt).getTime() : until.getTime();
  return Math.max(0, Math.floor((end - start) / 86_400_000));
}
