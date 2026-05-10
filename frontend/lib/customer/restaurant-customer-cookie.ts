import { cookies } from "next/headers";

import { STORAGE_KEYS } from "@/constants";

const COOKIE_VERSION = 1;
const PROFILE_COOKIE_TTL_DAYS = 90;
const MAX_PROFILE_ADDRESSES = 5;

export type RestaurantCustomerAddressCookieItem = {
  address: string;
  updated_at: string;
};

export type RestaurantCustomerProfileCookie = {
  name?: string;
  phone?: string;
  addresses: RestaurantCustomerAddressCookieItem[];
};

type RestaurantCustomerProfileCookiePayload = RestaurantCustomerProfileCookie & {
  v: number;
};

type RestaurantCustomerProfileInput = {
  name?: string;
  phone?: string;
  address?: string;
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

const normalizeOptionalText = (value: unknown): string | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const normalizeAddressItems = (
  value: unknown,
): RestaurantCustomerAddressCookieItem[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  const addressesByText = new Map<string, RestaurantCustomerAddressCookieItem>();
  for (const item of value) {
    if (!isRecord(item)) {
      continue;
    }

    const address = normalizeOptionalText(item.address);
    const updatedAt = normalizeOptionalText(item.updated_at);
    if (!address || !updatedAt) {
      continue;
    }

    const key = address.toLowerCase();
    if (!addressesByText.has(key)) {
      addressesByText.set(key, { address, updated_at: updatedAt });
    }
  }

  return Array.from(addressesByText.values()).slice(0, MAX_PROFILE_ADDRESSES);
};

const parseProfileCookie = (
  rawCookie?: string,
): RestaurantCustomerProfileCookiePayload => {
  if (!rawCookie) {
    return { v: COOKIE_VERSION, addresses: [] };
  }

  try {
    const parsed = JSON.parse(rawCookie) as unknown;
    if (!isRecord(parsed)) {
      return { v: COOKIE_VERSION, addresses: [] };
    }

    return {
      v: COOKIE_VERSION,
      name: normalizeOptionalText(parsed.name),
      phone: normalizeOptionalText(parsed.phone),
      addresses: normalizeAddressItems(parsed.addresses),
    };
  } catch {
    return { v: COOKIE_VERSION, addresses: [] };
  }
};

async function readProfileCookiePayload(): Promise<RestaurantCustomerProfileCookiePayload> {
  const cookieStore = await cookies();
  const rawCookie = cookieStore.get(
    STORAGE_KEYS.RESTAURANT_CUSTOMER_PROFILE,
  )?.value;

  return parseProfileCookie(rawCookie);
}

async function writeProfileCookie(
  payload: RestaurantCustomerProfileCookiePayload,
): Promise<void> {
  const cookieStore = await cookies();
  const expiresAt = new Date(
    Date.now() + PROFILE_COOKIE_TTL_DAYS * 24 * 60 * 60 * 1000,
  );

  cookieStore.set(
    STORAGE_KEYS.RESTAURANT_CUSTOMER_PROFILE,
    JSON.stringify(payload),
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: expiresAt,
    },
  );
}

export async function getRestaurantCustomerProfileFromCookie(): Promise<RestaurantCustomerProfileCookie> {
  const payload = await readProfileCookiePayload();

  return {
    name: payload.name,
    phone: payload.phone,
    addresses: payload.addresses,
  };
}

export async function upsertRestaurantCustomerProfileInCookie(
  profile: RestaurantCustomerProfileInput,
): Promise<void> {
  const payload = await readProfileCookiePayload();
  const name = normalizeOptionalText(profile.name) || payload.name;
  const phone = normalizeOptionalText(profile.phone) || payload.phone;
  const address = normalizeOptionalText(profile.address);
  const nextAddresses = [...payload.addresses];

  if (address) {
    const addressKey = address.toLowerCase();
    const dedupedAddresses = nextAddresses.filter(
      (item) => item.address.toLowerCase() !== addressKey,
    );
    nextAddresses.length = 0;
    nextAddresses.push(
      { address, updated_at: new Date().toISOString() },
      ...dedupedAddresses,
    );
  }

  await writeProfileCookie({
    v: COOKIE_VERSION,
    name,
    phone,
    addresses: nextAddresses.slice(0, MAX_PROFILE_ADDRESSES),
  });
}
