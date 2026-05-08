"use server";

import { redirect } from "next/navigation";

import { clearCartCookie } from "@/lib/cart/customer-cart-cookie";

type CheckoutOrderState = {
	success: boolean;
	message?: string;
};

type CheckoutOrderItem = {
	menuItemId: number;
	quantity: number;
};

const getRequiredString = (formData: FormData, key: string) => {
	const value = formData.get(key);
	return typeof value === "string" ? value.trim() : "";
};

const getRequiredNumber = (formData: FormData, key: string) => {
	const value = Number(formData.get(key));
	return Number.isFinite(value) ? value : 0;
};

const getOrderItems = (formData: FormData): CheckoutOrderItem[] => {
	const rawItems = getRequiredString(formData, "items");
	if (!rawItems) {
		return [];
	}

	try {
		const parsed = JSON.parse(rawItems) as unknown;
		if (!Array.isArray(parsed)) {
			return [];
		}

		return parsed.flatMap((item) => {
			if (typeof item !== "object" || item === null || Array.isArray(item)) {
				return [];
			}

			const record = item as Record<string, unknown>;
			const menuItemId = Number(record.menuItemId);
			const quantity = Number(record.quantity);

			if (!Number.isInteger(menuItemId) || menuItemId <= 0 || quantity <= 0) {
				return [];
			}

			return [{ menuItemId, quantity }];
		});
	} catch {
		return [];
	}
};

export async function submitCheckoutOrderAction(
	_prevState: CheckoutOrderState,
	formData: FormData,
): Promise<CheckoutOrderState> {
	const branchId = getRequiredString(formData, "branchId");
	const deliveryServiceCode = getRequiredString(formData, "deliveryServiceCode");
	const customerName = getRequiredString(formData, "customerName");
	const customerMobile = getRequiredString(formData, "customerMobile");
	const customerAddress = getRequiredString(formData, "customerAddress");
	const remarks = getRequiredString(formData, "remarks").slice(0, 200);
	const posDeliveryServiceCode = getRequiredNumber(
		formData,
		"posDeliveryServiceCode",
	);
	const items = getOrderItems(formData);
	const total = getRequiredNumber(formData, "total");

	if (
		!branchId ||
		!deliveryServiceCode ||
		!customerName ||
		!customerMobile ||
		!customerAddress ||
		posDeliveryServiceCode <= 0 ||
		items.length === 0
	) {
		return { success: false, message: "يرجى مراجعة بيانات الطلب" };
	}

	const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
	const response = await fetch(`${baseUrl}/branches/${branchId}/orders`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			customerName,
			customerMobile,
			customerAddress,
			deliveryServiceCode: posDeliveryServiceCode,
			items,
			remarks,
			total,
		}),
		cache: "no-store",
	});

	if (!response.ok) {
		let message = "فشل في إرسال الطلب";
		try {
			const data = (await response.json()) as { message?: unknown };
			if (typeof data.message === "string" && data.message.trim()) {
				message = data.message;
			}
		} catch {
			// Keep the generic Arabic error message.
		}

		return { success: false, message };
	}

	let orderId = "";
	try {
		const data = (await response.json()) as { data?: { id?: unknown }; id?: unknown };
		const rawOrderId = data.data?.id ?? data.id;
		orderId = rawOrderId ? String(rawOrderId) : "";
	} catch {
		orderId = "";
	}

	await clearCartCookie();

	const params = new URLSearchParams({
		branchId,
		deliveryServiceCode,
		mobile: customerMobile,
	});
	if (orderId) {
		params.set("orderId", orderId);
	}

	redirect(`/checkout/success?${params.toString()}`);
}
