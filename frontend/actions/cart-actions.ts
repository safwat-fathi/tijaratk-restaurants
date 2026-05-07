"use server";

import { revalidatePath } from "next/cache";

import {
  clearCartCookie,
  setCartItemQuantityInCookie,
} from "@/lib/cart/customer-cart-cookie";

type CartActionResult = {
  success: boolean;
  error?: string;
};

export async function setCartItemQuantityAction(
  branchId: string,
  deliveryServiceCode: string,
  menuItemId: number,
  quantity: number,
): Promise<CartActionResult> {
  try {
    await setCartItemQuantityInCookie(
      branchId,
      deliveryServiceCode,
      menuItemId,
      quantity,
    );
    revalidatePath("/menu");
    revalidatePath("/checkout");
    return { success: true };
  } catch {
    return { success: false, error: "تعذر تحديث السلة" };
  }
}

export async function clearCartAction(): Promise<CartActionResult> {
  try {
    await clearCartCookie();
    revalidatePath("/menu");
    revalidatePath("/checkout");
    return { success: true };
  } catch {
    return { success: false, error: "تعذر مسح السلة" };
  }
}
