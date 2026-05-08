import HttpService from "@/services/base/http.service";
import type { Tenant } from "@/types/models/tenant";

class TenantsService extends HttpService {
	constructor() {
		super("/tenants");
	}

	public async getMyTenant() {
		return this.get<Tenant>("me", undefined, {
			cache: "no-store",
			authRequired: true,
		});
	}
}

export const tenantsService = new TenantsService();
