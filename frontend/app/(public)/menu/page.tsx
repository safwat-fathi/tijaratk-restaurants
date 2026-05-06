import { redirect } from "next/navigation";
import { menuService } from "@/services/api/menu.service";
import MenuClient from "./_components/MenuClient";

type MenuPageProps = {
  searchParams: Promise<{ branchId?: string }>;
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
  
  if (!searchParams.branchId) {
    redirect("/");
  }

  const categories = await getMenuData(searchParams.branchId);

  return <MenuClient categories={categories} branchId={searchParams.branchId} />;
}
