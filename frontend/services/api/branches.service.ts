import HttpService from "@/services/base/http.service";
import { Branch } from "@/types/models/branch";

class BranchesService extends HttpService {
  constructor() {
    super("/branches");
  }

  public async getBranches() {
    return this.get<Branch[]>("", undefined, {
      cache: "no-store",
    });
  }
}

export const branchesService = new BranchesService();
