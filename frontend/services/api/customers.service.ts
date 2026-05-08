import HttpService from "@/services/base/http.service";
import type { Customer } from "@/types/models/customer";

type GetCustomersParams = {
	search?: string;
	page?: number;
	limit?: number;
};

type CustomersPageResponse = {
	data: Customer[];
	meta?: {
		total?: number;
		page?: number;
		last_page?: number;
	};
};

class CustomersService extends HttpService {
	constructor() {
		super("/customers");
	}

	public async getCustomers(params?: GetCustomersParams) {
		return this.get<CustomersPageResponse>("", params, {
			cache: "no-store",
			authRequired: true,
		});
	}

	public async getCustomer(customerId: number) {
		return this.get<Customer>(String(customerId), undefined, {
			cache: "no-store",
			authRequired: true,
		});
	}
}

export const customersService = new CustomersService();
