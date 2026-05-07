import { redirect } from "next/navigation";
import { menuService } from "@/services/api/menu.service";
import { listCartItemsFromCookie } from "@/lib/cart/customer-cart-cookie";
import MenuClient from "./_components/MenuClient";

type MenuPageProps = {
  searchParams: Promise<{ branchId?: string; deliveryServiceCode?: string }>;
};

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

export default async function MenuPage(props: MenuPageProps) {
  const searchParams = await props.searchParams;
  
  if (!searchParams.branchId || !searchParams.deliveryServiceCode) {
    redirect("/");
  }

  const [categories, initialCartItems] = await Promise.all([
    getMenuData(searchParams.branchId),
    listCartItemsFromCookie(
      searchParams.branchId,
      searchParams.deliveryServiceCode,
    ),
  ]);

  return (
    <MenuClient
      categories={categories}
      branchId={searchParams.branchId}
      deliveryServiceCode={searchParams.deliveryServiceCode}
      initialCartItems={initialCartItems}
    />
  );
}
