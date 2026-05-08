import HttpService from "@/services/base/http.service";
import type { Order } from "@/types/models/order";
import type {
	CloseDayResponse,
	CreateOrderRequest,
	DayCloseTodayStatusResponse,
} from "@/types/services/orders";
import type { OrderStatus } from "@/types/enums";

type UpdateOrderPayload = {
	status?: OrderStatus;
};

type UpdateOrderItemPricePayload = {
	total_price: number;
};

type RejectOrderPayload = {
	reason?: string;
};

class OrdersService extends HttpService {
	constructor() {
		super("/orders");
	}

	public async getOrders(date?: string) {
		return this.get<Order[]>("", date ? { date } : undefined, {
			cache: "no-store",
			authRequired: true,
		});
	}

	public async getOrder(orderId: number) {
		return this.get<Order>(String(orderId), undefined, {
			cache: "no-store",
			authRequired: true,
		});
	}

	public async updateOrder(orderId: number, payload: UpdateOrderPayload) {
		return this.patch<Order>(String(orderId), payload, undefined, {
			authRequired: true,
		});
	}

	public async updateOrderItemPrice(
		itemId: number,
		payload: UpdateOrderItemPricePayload,
	) {
		return this.patch<Order>(`items/${itemId}/price`, payload, undefined, {
			authRequired: true,
		});
	}

	public async closeDay() {
		return this.post<CloseDayResponse>("day-close", undefined, undefined, {
			authRequired: true,
		});
	}

	public async getTodayDayCloseStatus() {
		return this.get<DayCloseTodayStatusResponse>("day-close/today", undefined, {
			cache: "no-store",
			authRequired: true,
		});
	}

	public async createPublicOrder(tenantSlug: string, payload: CreateOrderRequest) {
		return this.post<Order>(`public/${tenantSlug}`, payload);
	}

	public async getOrderByPublicToken(token: string) {
		return this.get<Order>(`public-token/${token}`, undefined, {
			cache: "no-store",
		});
	}

	public async getOrdersByPublicTokens(tokens: string[]) {
		return this.post<Order[]>("public-tokens", { tokens }, undefined, {
			cache: "no-store",
		});
	}

	public async rejectOrderByToken(token: string, payload: RejectOrderPayload) {
		return this.post<Order>(`public-token/${token}/reject`, payload);
	}
}

export const ordersService = new OrdersService();
