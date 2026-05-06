import HttpService from "@/services/base/http.service";
import { DeliveryService } from "@/types/models/delivery-service";

class DeliveryServicesService extends HttpService {
  constructor() {
    super("/branches");
  }

  public async getBranchDeliveryServices(branchId: string | number) {
    return this.get<DeliveryService[]>(`${branchId}/delivery-services`, undefined, {
      cache: "no-store",
    });
  }
}

export const deliveryServicesService = new DeliveryServicesService();
