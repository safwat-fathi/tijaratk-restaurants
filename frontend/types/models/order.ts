import { OrderStatus, OrderType, PricingMode } from '../enums';

export interface OrderCustomer {
  name?: string;
  phone?: string;
  address?: string;
  [key: string]: unknown;
}

export type OrderItemSelectionMode = "quantity" | "weight" | "price" | null;
export type OrderNumericValue = number | string | null;

export interface OrderItem {
  id: number;
  order_id: number;
  product_id?: number | null;
  name_snapshot: string;
  quantity: string;
  unit_price?: OrderNumericValue;
  total_price?: OrderNumericValue;
  notes?: string;
  selection_mode?: OrderItemSelectionMode;
  selection_quantity?: OrderNumericValue;
  selection_grams?: number | null;
  selection_amount_egp?: OrderNumericValue;
  unit_option_id?: string | null;
}

export interface Order {
  id: number;
  tenant_id: number;
  tenant?: {
    name: string;
    id: number;
    slug?: string;
  };
  customer_id: number;
  customer?: OrderCustomer;
  items: OrderItem[];
  public_token: string;
  order_type: OrderType;
  status: OrderStatus;
  pricing_mode: PricingMode;
  subtotal?: OrderNumericValue;
  delivery_fee?: OrderNumericValue;
  total?: OrderNumericValue;
  free_text_payload?: { text?: string };
  notes?: string;
  customer_rejection_reason?: string | null;
  customer_rejected_at?: string | null;
  created_at: string;
  updated_at: string;
}
