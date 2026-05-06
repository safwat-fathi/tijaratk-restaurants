import HttpService from "@/services/base/http.service";
import { MenuCategory } from "@/types/models/menu";

class MenuService extends HttpService {
  constructor() {
    super("/branches");
  }

  public async getBranchMenu(branchId: string | number) {
    return this.get<MenuCategory[]>(`${branchId}/menu`, undefined, {
      cache: "no-store",
    });
  }
}

export const menuService = new MenuService();
