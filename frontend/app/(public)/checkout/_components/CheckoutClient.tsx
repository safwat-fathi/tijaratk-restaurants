"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Loader2, MapPin } from "lucide-react";
import { useDebouncedCallback } from "use-debounce";

import {
	lookupCheckoutCustomerAction,
	submitCheckoutOrderAction,
	type CheckoutCustomerLookupAddress,
} from "@/actions/checkout-actions";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import type { RestaurantCustomerProfileCookie } from "@/lib/customer/restaurant-customer-cookie";
import { MenuItem } from "@/types/models/menu";
import { DeliveryService } from "@/types/models/delivery-service";

type CartItem = {
  menuItem: MenuItem;
  quantity: number;
};

type SavedAddress = {
	id: string;
	address: string;
	lastUsedAt: string;
};

type CheckoutClientProps = {
	branchId: string;
	deliveryServiceCode: string;
	selectedBranchName: string;
	selectedDeliveryService: DeliveryService;
	initialCustomerProfile: RestaurantCustomerProfileCookie;
	initialCartItems: CartItem[];
};

const digitsOnly = (value: string) => value.replace(/\D/g, "");

const createInitialSavedAddresses = (
	profile: RestaurantCustomerProfileCookie,
): SavedAddress[] => {
	return profile.addresses.map((item, index) => ({
		id: `cookie-${index + 1}`,
		address: item.address,
		lastUsedAt: item.updated_at,
	}));
};

const mergeSavedAddresses = (
	lookupAddresses: CheckoutCustomerLookupAddress[],
	currentAddresses: SavedAddress[],
): SavedAddress[] => {
	const addressesByText = new Map<string, SavedAddress>();

	for (const item of lookupAddresses) {
		const address = item.address.trim();
		if (!address) {
			continue;
		}

		addressesByText.set(address.toLowerCase(), {
			id: `lookup-${item.id}`,
			address,
			lastUsedAt: item.lastUsedAt,
		});
	}

	for (const item of currentAddresses) {
		const address = item.address.trim();
		if (!address || addressesByText.has(address.toLowerCase())) {
			continue;
		}

		addressesByText.set(address.toLowerCase(), item);
	}

	return Array.from(addressesByText.values()).slice(0, 5);
};

export default function CheckoutClient({
	branchId,
	deliveryServiceCode,
	selectedBranchName,
	selectedDeliveryService,
	initialCustomerProfile,
	initialCartItems,
}: CheckoutClientProps) {
	const initialSavedAddresses = createInitialSavedAddresses(
		initialCustomerProfile,
	);
	const initialAddress = initialSavedAddresses[0]?.address || "";
	const [formData, setFormData] = useState({
		customerName: initialCustomerProfile.name || "",
		customerMobile: initialCustomerProfile.phone || "",
		customerAddress: initialAddress,
		remarks: "",
	});
	const [itemRemarksById, setItemRemarksById] = useState<
		Record<number, string>
	>({});
	const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>(
		initialSavedAddresses,
	);
	const savedAddressesRef = useRef(initialSavedAddresses);
	const [selectedSavedAddressId, setSelectedSavedAddressId] = useState(
		initialSavedAddresses[0]?.id || "",
	);
	const [isAddressConfirmed, setIsAddressConfirmed] = useState(false);
	const [isAddressSheetOpen, setIsAddressSheetOpen] = useState(false);
	const [lookupStatus, setLookupStatus] = useState<
		"idle" | "loading" | "found" | "empty" | "error"
	>(initialSavedAddresses.length > 0 ? "found" : "idle");
	const [isLookupPending, startLookupTransition] = useTransition();
	const latestLookupPhoneRef = useRef("");
	const lastAutoOpenedPhoneRef = useRef("");
	const dirtyFieldsRef = useRef({
		name: Boolean(initialCustomerProfile.name),
		address: Boolean(initialAddress),
	});
	const [state, formAction, isSubmitting] = useActionState(
		submitCheckoutOrderAction,
		{ success: false },
	);

	const cartItems = initialCartItems;
	const subtotal = cartItems.reduce(
		(acc, item) => acc + Number(item.menuItem.price) * item.quantity,
		0,
	);

	const deliveryFee = Number(selectedDeliveryService.amount) || 0;
	const vatRate = 0.14;
	const vatAmount = (subtotal + deliveryFee) * vatRate;
	const finalTotal = subtotal + deliveryFee + vatAmount;
	const checkoutItems = JSON.stringify(
		cartItems.map(item => ({
			menuItemId: item.menuItem.id,
			quantity: item.quantity,
			remarks: itemRemarksById[item.menuItem.id]?.trim() || undefined,
		})),
	);
	const selectedSavedAddress = savedAddresses.find(
		item => item.id === selectedSavedAddressId,
	);
	const isLookingUpCustomer = lookupStatus === "loading" || isLookupPending;
	const needsAddressConfirmation = Boolean(
		selectedSavedAddress &&
		formData.customerAddress.trim() === selectedSavedAddress.address.trim() &&
		!isAddressConfirmed,
	);

	const applySavedAddress = (address: SavedAddress) => {
		setFormData(current => ({ ...current, customerAddress: address.address }));
		setSelectedSavedAddressId(address.id);
		setIsAddressConfirmed(false);
		setIsAddressSheetOpen(false);
		dirtyFieldsRef.current.address = false;
	};

	const confirmSavedAddress = (address: SavedAddress) => {
		setFormData(current => ({ ...current, customerAddress: address.address }));
		setSelectedSavedAddressId(address.id);
		setIsAddressConfirmed(true);
		dirtyFieldsRef.current.address = false;
	};

	const lookupCustomer = useDebouncedCallback((phone: string) => {
		const normalizedPhone = phone.trim();
		if (digitsOnly(normalizedPhone).length < 10) {
			latestLookupPhoneRef.current = "";
			lastAutoOpenedPhoneRef.current = "";
			savedAddressesRef.current = [];
			setSavedAddresses([]);
			setSelectedSavedAddressId("");
			setIsAddressConfirmed(false);
			setLookupStatus("idle");
			return;
		}

		latestLookupPhoneRef.current = normalizedPhone;
		setLookupStatus("loading");
		startLookupTransition(async () => {
			try {
				const response = await lookupCheckoutCustomerAction(
					branchId,
					normalizedPhone,
				);
				if (latestLookupPhoneRef.current !== normalizedPhone) {
					return;
				}

				if (!response.success || !response.data) {
					savedAddressesRef.current = [];
					setSavedAddresses([]);
					setSelectedSavedAddressId("");
					setIsAddressConfirmed(false);
					setLookupStatus("error");
					return;
				}

				const isInitialProfilePhone =
					digitsOnly(normalizedPhone) ===
					digitsOnly(initialCustomerProfile.phone || "");
				const nextAddressesSnapshot = mergeSavedAddresses(
					response.data.addresses,
					isInitialProfilePhone ? savedAddressesRef.current : [],
				);
				savedAddressesRef.current = nextAddressesSnapshot;
				setSavedAddresses(nextAddressesSnapshot);

				setLookupStatus(
					nextAddressesSnapshot.length > 0 ? "found" : "empty",
				);

				const onlyAddress =
					nextAddressesSnapshot.length === 1 ? nextAddressesSnapshot[0] : null;
					setFormData(current => ({
					...current,
					customerName:
						!dirtyFieldsRef.current.name && response.data?.name
							? response.data.name
							: current.customerName,
					customerAddress:
						onlyAddress && !dirtyFieldsRef.current.address
							? onlyAddress.address
							: current.customerAddress,
				}));

				if (onlyAddress) {
					setSelectedSavedAddressId(onlyAddress.id);
					setIsAddressConfirmed(false);
				} else if (nextAddressesSnapshot.length > 1) {
					setSelectedSavedAddressId("");
					setIsAddressConfirmed(false);
					if (lastAutoOpenedPhoneRef.current !== normalizedPhone) {
						lastAutoOpenedPhoneRef.current = normalizedPhone;
						setIsAddressSheetOpen(true);
					}
				} else {
					setSelectedSavedAddressId("");
					setIsAddressConfirmed(false);
				}
			} catch {
				if (latestLookupPhoneRef.current === normalizedPhone) {
					savedAddressesRef.current = [];
					setSavedAddresses([]);
					setSelectedSavedAddressId("");
					setIsAddressConfirmed(false);
					setLookupStatus("error");
				}
			}
		});
	}, 650);

	const handlePhoneChange = (phone: string) => {
		setFormData(current => ({ ...current, customerMobile: phone }));
		lookupCustomer(phone);
	};

	const handleNameChange = (name: string) => {
		dirtyFieldsRef.current.name = true;
		setFormData(current => ({ ...current, customerName: name }));
	};

	const handleAddressChange = (address: string) => {
		dirtyFieldsRef.current.address = true;
		setFormData(current => ({ ...current, customerAddress: address }));
		setIsAddressConfirmed(false);
	};

	const renderSubmitButtonContent = () => {
		if (isSubmitting) {
			return (
				<>
					<Loader2 className="w-6 h-6 animate-spin" />
					جاري الإرسال...
				</>
			);
		}

		if (needsAddressConfirmation) {
			return "أكد العنوان أولاً";
		}

		return "تأكيد الطلب";
	};

	return (
		<div className="w-full flex flex-col bg-[#fff8f5] min-h-screen pb-24">
			<header className="sticky top-0 z-40 w-full bg-[#fff8f5]/90 backdrop-blur-md border-b border-[#e9e1dc]">
				<div className="flex items-center justify-between px-4 h-16 max-w-2xl mx-auto w-full">
					<Link
						href={`/menu?branchId=${branchId}&deliveryServiceCode=${deliveryServiceCode}`}
						className="p-2 -mr-2 rounded-full hover:bg-[#f5ece7] text-[#1e1b18] transition-colors"
					>
						<ArrowRight className="w-6 h-6" />
						<span className="sr-only">عودة للقائمة</span>
					</Link>
					<h1 className="font-aref-ruqaa text-2xl text-[#812f1d]">
						إتمام الطلب
					</h1>
					<div className="w-10" />
				</div>
			</header>

			<main className="w-full max-w-2xl mx-auto px-4 mt-6 space-y-8">
				<section className="bg-white border border-[#e9e1dc] rounded-xl p-5 shadow-sm">
					<h2 className="font-aref-ruqaa text-2xl text-[#1e1b18] mb-4 pb-4 border-b border-[#f5ece7]">
						ملخص الطلب
					</h2>
					<div className="space-y-4 mb-4">
						{cartItems.map(item => (
							<div key={item.menuItem.id} className="space-y-3">
								<div className="flex justify-between text-sm font-tajawal">
									<div className="flex items-center gap-2 text-[#1e1b18]">
										<span>{item.menuItem.name}</span>
										<span className="text-[#812f1d] font-bold" dir="ltr">
											{item.quantity}x
										</span>
									</div>
									<span className="font-noto-sans-arabic font-bold text-[#55423e]">
										{(Number(item.menuItem.price) * item.quantity).toFixed(2)}{" "}
										ج.م.
									</span>
								</div>
								<textarea
									rows={2}
									maxLength={200}
									value={itemRemarksById[item.menuItem.id] || ""}
									onChange={event =>
										setItemRemarksById(current => ({
											...current,
											[item.menuItem.id]: event.target.value,
										}))
									}
									className="w-full p-3 border border-[#ead7d2] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#812f1d]/40 focus:border-[#812f1d] font-tajawal text-sm text-[#1e1b18] bg-[#fdfaf8] resize-none"
									placeholder="ملاحظة لهذا الصنف (اختياري)"
								/>
							</div>
						))}
					</div>
					<div className="flex justify-between items-center pt-4 border-t border-[#f5ece7] text-sm font-tajawal text-[#55423e]">
						<span>المجموع</span>
						<span className="font-noto-sans-arabic font-bold">
							{subtotal.toFixed(2)} ج.م.
						</span>
					</div>
					<div className="flex justify-between items-center pt-2 text-sm font-tajawal text-[#55423e]">
						<span>رسوم التوصيل</span>
						<span className="font-noto-sans-arabic font-bold">
							{deliveryFee.toFixed(2)} ج.م.
						</span>
					</div>
					<div className="flex justify-between items-center pt-2 pb-4 text-sm font-tajawal text-[#55423e] border-b border-[#f5ece7]">
						<span>ضريبة القيمة المضافة (14%)</span>
						<span className="font-noto-sans-arabic font-bold">
							{vatAmount.toFixed(2)} ج.م.
						</span>
					</div>
					<div className="flex justify-between items-center pt-4">
						<span className="font-tajawal font-bold text-lg text-[#1e1b18]">
							الإجمالي النهائي
						</span>
						<span className="font-noto-sans-arabic font-bold text-xl text-[#812f1d]">
							{finalTotal.toFixed(2)} ج.م.
						</span>
					</div>
				</section>

				<section className="bg-white border border-[#e9e1dc] rounded-xl p-5 shadow-sm">
					<h2 className="font-aref-ruqaa text-2xl text-[#1e1b18] mb-6">
						بيانات التوصيل
					</h2>

					<form action={formAction} className="space-y-5">
						<input type="hidden" name="branchId" value={branchId} />
						<input
							type="hidden"
							name="deliveryServiceCode"
							value={deliveryServiceCode}
						/>
						<input
							type="hidden"
							name="posDeliveryServiceCode"
							value={selectedDeliveryService.posDeliveryServiceCode}
						/>
						<input type="hidden" name="items" value={checkoutItems} />
						<input type="hidden" name="total" value={finalTotal.toFixed(2)} />

						{state.message && !state.success && (
							<div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm font-tajawal">
								{state.message}
							</div>
						)}

						<div className="grid gap-4 sm:grid-cols-2">
							<div className="space-y-2">
								<label
									htmlFor="customerName"
									className="block text-sm font-bold text-[#1e1b18] font-tajawal"
								>
									الاسم
								</label>
								<input
									type="text"
									id="customerName"
									name="customerName"
									required
									value={formData.customerName}
									onChange={event => handleNameChange(event.target.value)}
									className="w-full p-3 border border-[#dcc1bb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#812f1d]/50 focus:border-[#812f1d] font-tajawal text-[#1e1b18] bg-[#fdfaf8]"
									placeholder="أدخل اسمك بالكامل"
								/>
							</div>

							<div className="space-y-2">
								<label
									htmlFor="customerMobile"
									className="block text-sm font-bold text-[#1e1b18] font-tajawal"
								>
									رقم الهاتف
								</label>
								<input
									type="tel"
									id="customerMobile"
									name="customerMobile"
									required
									value={formData.customerMobile}
									onChange={event => handlePhoneChange(event.target.value)}
									className="w-full p-3 border border-[#dcc1bb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#812f1d]/50 focus:border-[#812f1d] font-tajawal text-[#1e1b18] bg-[#fdfaf8]"
									placeholder="مثال: 01023314587"
									dir="ltr"
								/>
								{isLookingUpCustomer && (
									<p className="text-xs text-[#8a746c] font-tajawal">
										جاري البحث عن بيانات محفوظة...
									</p>
								)}
								{lookupStatus === "empty" && (
									<p className="text-xs text-[#8a746c] font-tajawal">
										لم نجد عناوين محفوظة لهذا الرقم. يمكنك إدخال العنوان يدوياً.
									</p>
								)}
								{lookupStatus === "error" && (
									<p className="text-xs text-[#8a746c] font-tajawal">
										تعذر البحث الآن. أكمل بياناتك بشكل طبيعي.
									</p>
								)}
							</div>
						</div>

						<div className="space-y-2">
							<label
								htmlFor="customerAddress"
								className="block text-sm font-bold text-[#1e1b18] font-tajawal"
							>
								عنوان التوصيل
							</label>
							<textarea
								id="customerAddress"
								name="customerAddress"
								required
								rows={3}
								value={formData.customerAddress}
								onChange={event => handleAddressChange(event.target.value)}
								className="w-full p-3 border border-[#dcc1bb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#812f1d]/50 focus:border-[#812f1d] font-tajawal text-[#1e1b18] bg-[#fdfaf8] resize-none"
								placeholder="أدخل عنوان التوصيل بالتفصيل (الحي، المجاورة، الشارع، رقم العمارة)"
							/>
						</div>

						{savedAddresses.length === 1 && selectedSavedAddress && (
							<div className="rounded-2xl border border-[#ead7d2] bg-[#fff8f5] p-4 font-tajawal text-sm text-[#55423e]">
								<div className="flex items-start gap-3">
									<MapPin className="mt-1 h-5 w-5 shrink-0 text-[#812f1d]" />
									<div className="flex-1">
										<p className="font-bold text-[#1e1b18]">
											وجدنا عنوان محفوظ لهذا الرقم
										</p>
										<p className="mt-1 leading-6">
											{selectedSavedAddress.address}
										</p>
										<div className="mt-3 flex flex-wrap gap-2">
											<button
												type="button"
												onClick={() => confirmSavedAddress(selectedSavedAddress)}
												className="rounded-full bg-[#812f1d] px-4 py-2 text-white transition-colors hover:bg-[#a04632]"
											>
												تأكيد العنوان
											</button>
											<button
												type="button"
												onClick={() =>
													handleAddressChange(selectedSavedAddress.address)
												}
												className="rounded-full border border-[#dcc1bb] px-4 py-2 text-[#812f1d] transition-colors hover:bg-white"
											>
												تعديل العنوان
											</button>
											<button
												type="button"
												onClick={() => setIsAddressSheetOpen(true)}
												className="rounded-full border border-[#dcc1bb] px-4 py-2 text-[#812f1d] transition-colors hover:bg-white"
											>
												اختيار عنوان آخر
											</button>
										</div>
									</div>
									{isAddressConfirmed && (
										<CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />
									)}
								</div>
							</div>
						)}

						{savedAddresses.length > 1 && (
							<div className="rounded-2xl border border-[#ead7d2] bg-[#fff8f5] p-4 font-tajawal text-sm text-[#55423e]">
								<div className="flex items-start justify-between gap-3">
									<div>
										<p className="font-bold text-[#1e1b18]">
											وجدنا أكثر من عنوان محفوظ
										</p>
										<p className="mt-1 leading-6">
											{selectedSavedAddress
												? selectedSavedAddress.address
												: "اختار العنوان المناسب للتوصيل."}
										</p>
									</div>
									{isAddressConfirmed && (
										<CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />
									)}
								</div>
								<div className="mt-3 flex flex-wrap gap-2">
									<button
										type="button"
										onClick={() => setIsAddressSheetOpen(true)}
										className="rounded-full bg-[#812f1d] px-4 py-2 text-white transition-colors hover:bg-[#a04632]"
									>
										اختيار عنوان
									</button>
									{selectedSavedAddress && (
										<button
											type="button"
											onClick={() => confirmSavedAddress(selectedSavedAddress)}
											className="rounded-full border border-[#dcc1bb] px-4 py-2 text-[#812f1d] transition-colors hover:bg-white"
										>
											تأكيد العنوان
										</button>
									)}
								</div>
							</div>
						)}

						<div className="grid gap-3 rounded-2xl border border-[#ead7d2] bg-[#fdfaf8] p-4 font-tajawal text-sm text-[#55423e] sm:grid-cols-2">
							<div>
								<span className="block text-xs text-[#8a746c]">
									الفرع المختار
								</span>
								<strong className="text-[#1e1b18]">{selectedBranchName}</strong>
							</div>
							<div>
								<span className="block text-xs text-[#8a746c]">
									منطقة التوصيل
								</span>
								<strong className="text-[#1e1b18]">
									{selectedDeliveryService.name}
								</strong>
							</div>
						</div>

						<div className="space-y-2">
							<label
								htmlFor="remarks"
								className="block text-sm font-bold text-[#1e1b18] font-tajawal"
							>
								ملاحظات الطلب
							</label>
							<textarea
								id="remarks"
								name="remarks"
								rows={2}
								maxLength={200}
								value={formData.remarks}
								onChange={event =>
									setFormData(current => ({
										...current,
										remarks: event.target.value,
									}))
								}
								className="w-full p-3 border border-[#dcc1bb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#812f1d]/50 focus:border-[#812f1d] font-tajawal text-[#1e1b18] bg-[#fdfaf8] resize-none"
								placeholder="مثال: بدون مخلل أو أي ملاحظات إضافية"
							/>
						</div>

						<button
							type="submit"
							disabled={isSubmitting || needsAddressConfirmation}
							className="w-full mt-8 bg-[#812f1d] hover:bg-[#a04632] disabled:bg-[#dcc1bb] disabled:cursor-not-allowed text-white py-4 rounded-[4px] font-aref-ruqaa text-2xl shadow-md transition-colors flex items-center justify-center gap-2"
						>
							{renderSubmitButtonContent()}
						</button>
					</form>
				</section>
			</main>

			<BottomSheet
				isOpen={isAddressSheetOpen}
				onClose={() => setIsAddressSheetOpen(false)}
				title="اختيار العنوان"
			>
				<div className="space-y-3 font-tajawal">
					{savedAddresses.map(address => {
						const isSelected = address.id === selectedSavedAddressId;

						return (
							<button
								key={address.id}
								type="button"
								onClick={() => applySavedAddress(address)}
								className={`w-full rounded-2xl border p-4 text-right transition-colors ${
									isSelected
										? "border-[#812f1d] bg-[#fbf2ed]"
										: "border-[#e9e1dc] bg-white hover:bg-[#fff8f5]"
								}`}
							>
								<span className="block font-bold text-[#1e1b18]">
									{address.address}
								</span>
								<span className="mt-2 block text-xs text-[#8a746c]">
									آخر استخدام:{" "}
									{new Date(address.lastUsedAt).toLocaleDateString("ar-EG")}
								</span>
							</button>
						);
					})}
				</div>
			</BottomSheet>
		</div>
	);
}
