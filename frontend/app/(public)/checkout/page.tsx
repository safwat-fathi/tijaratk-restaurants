import { redirect } from "next/navigation";
import CheckoutClient from "./_components/CheckoutClient";
import { deliveryServicesService } from "@/services/api/delivery-services.service";
import { menuService } from "@/services/api/menu.service";
import { listCartItemsFromCookie } from "@/lib/cart/customer-cart-cookie";
import { MenuCategory, MenuItem } from "@/types/models/menu";

type CheckoutPageProps = {
  searchParams: Promise<{ branchId?: string; deliveryServiceCode?: string }>;
};

async function getDeliveryServices(branchId: string) {
  try {
    const response = await deliveryServicesService.getBranchDeliveryServices(branchId);

    if (response.success && response.data) {
      return response.data;
    }

    return [];
  } catch {
    return [];
  }
}

async function getMenuData(branchId: string) {
  try {
    const response = await menuService.getBranchMenu(branchId);

    if (response.success && response.data) {
      return response.data;
    }

    return [];
  } catch {
    return [];
  }
}

const resolveCartItems = (
  categories: MenuCategory[],
  cartItems: Array<{ menu_item_id: number; quantity: number }>,
) => {
  const menuItemsById = new Map<number, MenuItem>();
  for (const category of categories) {
    for (const item of category.items) {
      menuItemsById.set(item.id, item);
    }
  }

  return cartItems.flatMap((cartItem) => {
    const menuItem = menuItemsById.get(cartItem.menu_item_id);
    if (!menuItem) {
      return [];
    }

    return [{ menuItem, quantity: cartItem.quantity }];
  });
};

export default async function CheckoutPage(props: CheckoutPageProps) {
  const searchParams = await props.searchParams;
  
  if (!searchParams.branchId || !searchParams.deliveryServiceCode) {
    redirect("/");
  }

  const [deliveryServices, categories, cookieCartItems] = await Promise.all([
    getDeliveryServices(searchParams.branchId),
    getMenuData(searchParams.branchId),
    listCartItemsFromCookie(
      searchParams.branchId,
      searchParams.deliveryServiceCode,
    ),
  ]);
  const selectedDeliveryService = deliveryServices.find(
    (service) =>
      String(service.posDeliveryServiceCode) === searchParams.deliveryServiceCode,
  );
  const cartItems = resolveCartItems(categories, cookieCartItems);

  if (!selectedDeliveryService || cartItems.length === 0) {
    redirect(
      `/menu?branchId=${searchParams.branchId}&deliveryServiceCode=${searchParams.deliveryServiceCode}`,
    );
  }

  return (
    <CheckoutClient
      branchId={searchParams.branchId}
      deliveryServiceCode={searchParams.deliveryServiceCode}
      selectedDeliveryService={selectedDeliveryService}
      initialCartItems={cartItems}
    />
  );
}
