export interface MenuItem {
  id: number;
  posOrderCode: number;
  name: string;
  price: number | string;
  isActive: boolean;
  categoryId: number;
}

export interface MenuCategory {
  id: number;
  name: string;
  normalizedName: string;
  items: MenuItem[];
}
