export interface Category {
  readonly id: string;
  name: string;
  builtIn: boolean;
  color?: string;
  icon?: string;          // Material icon name
}

export const DEFAULT_CATEGORIES: ReadonlyArray<Category> = [
  { id: 'cat-clothing',    name: 'Clothing',    builtIn: true, icon: 'checkroom',         color: '#C8B5C4' },
  { id: 'cat-books',       name: 'Books',       builtIn: true, icon: 'menu_book',         color: '#D8CFBE' },
  { id: 'cat-electronics', name: 'Electronics', builtIn: true, icon: 'devices',           color: '#9CB3C8' },
  { id: 'cat-furniture',   name: 'Furniture',   builtIn: true, icon: 'chair',             color: '#D9B97E' },
  { id: 'cat-vehicles',    name: 'Vehicles',    builtIn: true, icon: 'directions_car',    color: '#7FA88A' },
  { id: 'cat-investments', name: 'Investments', builtIn: true, icon: 'trending_up',       color: '#8FA39C' },
  { id: 'cat-other',       name: 'Other',       builtIn: true, icon: 'category',          color: '#A39F98' },
];
