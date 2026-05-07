import { cookies } from "next/headers";

import { STORAGE_KEYS } from "@/constants";

const CART_COOKIE_VERSION = 1;
const CART_COOKIE_TTL_DAYS = 7;
const MAX_CART_ITEMS = 30;

export type CartCookieItem = {
  menu_item_id: number;
  quantity: number;
};

type CartCookiePayload = {
  v: number;
  branch_id: string;
  delivery_service_code: string;
  items: CartCookieItem[];
};

const emptyCartPayload = (
  branchId: string,
  deliveryServiceCode: string,
): CartCookiePayload => ({
  v: CART_COOKIE_VERSION,
  branch_id: branchId,
  delivery_service_code: deliveryServiceCode,
  items: [],
});

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

const normalizeCartItem = (value: unknown): CartCookieItem | null => {
  if (!isRecord(value)) {
    return null;
  }

  const menuItemId = Number(value.menu_item_id);
  const quantity = Number(value.quantity);

  if (!Number.isInteger(menuItemId) || menuItemId <= 0) {
    return null;
  }

  if (!Number.isInteger(quantity) || quantity <= 0) {
    return null;
  }

  return {
    menu_item_id: menuItemId,
    quantity,
  };
};

const parseCartCookie = (
  rawCookie: string | undefined,
  branchId: string,
  deliveryServiceCode: string,
): CartCookiePayload => {
  if (!rawCookie) {
    return emptyCartPayload(branchId, deliveryServiceCode);
  }

  try {
    const parsed = JSON.parse(rawCookie) as unknown;
    if (!isRecord(parsed)) {
      return emptyCartPayload(branchId, deliveryServiceCode);
    }

    if (
      parsed.branch_id !== branchId ||
      parsed.delivery_service_code !== deliveryServiceCode
    ) {
      return emptyCartPayload(branchId, deliveryServiceCode);
    }

    const items = Array.isArray(parsed.items)
      ? parsed.items.map(normalizeCartItem).filter((item) => item !== null)
      : [];

    return {
      v: CART_COOKIE_VERSION,
      branch_id: branchId,
      delivery_service_code: deliveryServiceCode,
      items: items.slice(0, MAX_CART_ITEMS),
    };
  } catch {
    return emptyCartPayload(branchId, deliveryServiceCode);
  }
};

async function readCartCookiePayload(
  branchId: string,
  deliveryServiceCode: string,
): Promise<CartCookiePayload> {
  const cookieStore = await cookies();
  const rawCookie = cookieStore.get(STORAGE_KEYS.CUSTOMER_CART)?.value;
  return parseCartCookie(rawCookie, branchId, deliveryServiceCode);
}

async function writeCartCookie(payload: CartCookiePayload): Promise<void> {
  const cookieStore = await cookies();
  const expiresAt = new Date(
    Date.now() + CART_COOKIE_TTL_DAYS * 24 * 60 * 60 * 1000,
  );

  cookieStore.set(STORAGE_KEYS.CUSTOMER_CART, JSON.stringify(payload), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function listCartItemsFromCookie(
  branchId: string,
  deliveryServiceCode: string,
): Promise<CartCookieItem[]> {
  const payload = await readCartCookiePayload(branchId, deliveryServiceCode);
  return payload.items;
}

export async function setCartItemQuantityInCookie(
  branchId: string,
  deliveryServiceCode: string,
  menuItemId: number,
  quantity: number,
): Promise<CartCookieItem[]> {
  const payload = await readCartCookiePayload(branchId, deliveryServiceCode);
  const itemsByMenuItemId = new Map(
    payload.items.map((item) => [item.menu_item_id, item]),
  );

  if (quantity <= 0) {
    itemsByMenuItemId.delete(menuItemId);
  } else {
    itemsByMenuItemId.set(menuItemId, {
      menu_item_id: menuItemId,
      quantity,
    });
  }

  const nextItems = Array.from(itemsByMenuItemId.values()).slice(0, MAX_CART_ITEMS);
  await writeCartCookie({
    v: CART_COOKIE_VERSION,
    branch_id: branchId,
    delivery_service_code: deliveryServiceCode,
    items: nextItems,
  });

  return nextItems;
}

export async function clearCartCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(STORAGE_KEYS.CUSTOMER_CART);
}
