"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowRight, Plus, Minus, ShoppingBag, Trash2 } from "lucide-react";
import { useDebouncedCallback } from "use-debounce";
import { setCartItemQuantityAction } from "@/actions/cart-actions";
import { MenuCategory, MenuItem } from "@/types/models/menu";
import { BottomSheet } from "@/components/ui/bottom-sheet";

type CartItem = {
  menuItem: MenuItem;
  quantity: number;
};

type MenuClientProps = {
	categories: MenuCategory[];
	branchId: string;
	deliveryServiceCode: string;
	initialCartItems: Array<{ menu_item_id: number; quantity: number }>;
};

const createInitialCart = (
	categories: MenuCategory[],
	initialCartItems: Array<{ menu_item_id: number; quantity: number }>,
): Record<number, CartItem> => {
	const menuItemsById = new Map<number, MenuItem>();
	for (const category of categories) {
		for (const item of category.items) {
			menuItemsById.set(item.id, item);
		}
	}

	const cart: Record<number, CartItem> = {};
	for (const cartItem of initialCartItems) {
		const menuItem = menuItemsById.get(cartItem.menu_item_id);
		if (menuItem) {
			cart[menuItem.id] = {
				menuItem,
				quantity: cartItem.quantity,
			};
		}
	}

	return cart;
};

export default function MenuClient({
	categories,
	branchId,
	deliveryServiceCode,
	initialCartItems,
}: MenuClientProps) {
	const displayCategories = categories.filter(
		category => category.name !== "مبيعات طلبات",
	);

	const [activeCategoryId, setActiveCategoryId] = useState<number | null>(
		displayCategories[0]?.id || null
	);

	const [cart, setCart] = useState<Record<number, CartItem>>(() =>
		createInitialCart(displayCategories, initialCartItems),
	);
	const [isCartOpen, setIsCartOpen] = useState(false);
	const cartRef = useRef(cart);
	const router = useRouter();

	const isClickScrolling = useRef(false);
	const scrollTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

	// After - fire and forget, no re-render triggered
	const debouncedSync = useDebouncedCallback(
		(itemId: number, newQuantity: number) => {
			void setCartItemQuantityAction(
				branchId,
				deliveryServiceCode,
				itemId,
				newQuantity,
			);
		},
		800,
	);
	useEffect(() => {
		cartRef.current = cart;
	}, [cart]);

	useEffect(() => {
		const observerCallback: IntersectionObserverCallback = (entries) => {
			if (isClickScrolling.current) return;
			for (const entry of entries) {
				if (entry.isIntersecting) {
					const id = parseInt(entry.target.id.replace("category-", ""));
					setActiveCategoryId(id);
				}
			}
		};

		const observer = new IntersectionObserver(observerCallback, {
			rootMargin: "-120px 0px -80% 0px",
		});

		const sections = document.querySelectorAll("section[id^='category-']");
		sections.forEach(section => observer.observe(section));

		return () => observer.disconnect();
	}, [displayCategories]);

	const updateQuantity = (item: MenuItem, delta: number) => {
		const currentQuantity = cartRef.current[item.id]?.quantity || 0;
		const newQuantity = Math.max(0, currentQuantity + delta);
		const nextCart = { ...cartRef.current };

		if (newQuantity === 0) {
			delete nextCart[item.id];
			if (Object.keys(nextCart).length === 0) setIsCartOpen(false);
		} else {
			nextCart[item.id] = {
				menuItem: item,
				quantity: newQuantity,
			};
		}

		cartRef.current = nextCart;
		setCart(nextCart);

		debouncedSync(item.id, newQuantity);
	};

	const handleCheckout = () => {
		setIsCartOpen(false);
		router.push(
			`/checkout?branchId=${branchId}&deliveryServiceCode=${deliveryServiceCode}`,
		);
	};

	const cartItems = Object.values(cart);
	const totalItems = cartItems.reduce((acc, item) => acc + item.quantity, 0);
	const totalPrice = cartItems.reduce(
		(acc, item) => acc + Number(item.menuItem.price) * item.quantity,
		0,
	);

	return (
		<div className="w-full flex flex-col bg-[#fff8f5] min-h-screen pb-32 relative">
			{/* Sticky Top App Bar */}
			<header className="sticky top-0 z-40 self-start w-full bg-[#fff8f5]/90 backdrop-blur-md border-b border-[#e9e1dc]">
				<div className="flex items-center justify-between px-4 h-16 max-w-3xl mx-auto w-full">
					<Link
						href="/"
						className="p-2 -mr-2 rounded-full hover:bg-[#f5ece7] text-[#1e1b18] transition-colors"
					>
						<ArrowRight className="w-6 h-6" />
						<span className="sr-only">عودة</span>
					</Link>
					<h1 className="font-aref-ruqaa text-2xl text-[#812f1d]">
						المخبز اللبناني
					</h1>
					<div className="w-10"></div> {/* Spacer for centering */}
				</div>

				{/* Horizontal Category Bar */}
				<div className="w-full max-w-3xl mx-auto overflow-x-auto hide-scrollbar border-t border-[#e9e1dc]/50">
					<ul className="flex items-center px-4 py-3 gap-6 whitespace-nowrap font-noto-sans-arabic text-sm">
						{displayCategories.map((category) => {
							const isActive = activeCategoryId === category.id;
							return (
							<li key={category.id} id={`tab-${category.id}`}>
								<Link
									href={`#category-${category.id}`}
									onClick={() => {
										setActiveCategoryId(category.id);
										
										isClickScrolling.current = true;
											if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
											scrollTimeout.current = setTimeout(() => {
												isClickScrolling.current = false;
											}, 1000);
										}}
										className={`block px-1 pb-1 border-b-2 transition-colors ${
											isActive
												? "border-[#a04632] text-[#812f1d] font-bold"
												: "border-transparent text-[#55423e] hover:text-[#1e1b18]"
										}`}
									>
										{category.name}
									</Link>
								</li>
							);
						})}
						{displayCategories.length === 0 && (
							<li className="text-[#55423e]">لا توجد فئات متاحة حالياً</li>
						)}
					</ul>
				</div>
			</header>

			{/* Menu Content */}
			<main className="w-full max-w-3xl mx-auto px-4 mt-6 space-y-12">
				{displayCategories.map(category => (
					<section
						key={category.id}
						id={`category-${category.id}`}
						className="scroll-mt-32 space-y-4"
					>
						<h2 className="font-aref-ruqaa text-3xl text-[#1e1b18] text-center mb-6">
							{category.name}
						</h2>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							{category.items.map(item => {
								// Wait for client mount to avoid hydration mismatch
								const quantity = cart[item.id]?.quantity || 0;
								const hasQuantity = quantity > 0;
								return (
									<div
										key={item.id}
										className="bg-[#ffffff] border border-[#dcc1bb] rounded-[4px] p-4 flex gap-4 shadow-sm hover:shadow-md transition-shadow"
									>
										{/* Thumbnail Placeholder */}
										<div className="relative w-24 h-24 flex-shrink-0 bg-[#f5ece7] rounded-[4px] overflow-hidden border border-[#e9e1dc]">
											<div className="absolute inset-0 flex items-center justify-center text-[#89726d]">
												<Image
													src="/main-logo.png"
													alt="صورة المنتج"
													fill
													className="object-contain opacity-30 p-4"
													sizes="96px"
												/>
											</div>
										</div>

										{/* Item Details */}
										<div className="flex flex-col flex-grow justify-between py-1">
											<div className="space-y-1">
												<h3 className="font-aref-ruqaa text-xl text-[#1e1b18] leading-tight">
													{item.name}
												</h3>
											</div>

											<div className="flex items-center justify-between mt-2">
												<span className="font-noto-sans-arabic font-bold text-[#812f1d]">
													{item.price} ج.م.
												</span>

												<div
													className={`relative flex items-center h-10 overflow-hidden rounded-full border transition-all duration-300 ease-out shrink-0 ${
														hasQuantity
															? "w-[116px] border-[#dcc1bb] bg-[#fbf2ed]"
															: "w-10 border-[#dcc1bb] bg-[#fbf2ed] hover:border-transparent hover:bg-[#a04632] hover:text-white text-[#a04632]"
													}`}
												>
													<div className="flex items-center justify-between w-[116px] h-full shrink-0">
														{/* Plus Button (Right side in RTL) */}
														<button
															onClick={() => updateQuantity(item, 1)}
															className={`flex items-center justify-center rounded-full transition-all duration-200 shrink-0 ${
																hasQuantity
																	? "w-8 h-8 mr-1 bg-white text-[#812f1d] shadow-sm hover:bg-[#812f1d] hover:text-white"
																	: "w-10 h-10 mr-0 text-inherit hover:text-inherit"
															}`}
														>
															<Plus
																className={hasQuantity ? "w-3 h-3" : "w-4 h-4"}
															/>
															<span className="sr-only">إضافة {item.name}</span>
														</button>

														{/* Quantity (Middle) */}
														<span
															className={`font-noto-sans-arabic font-bold text-[#1e1b18] flex-1 text-center transition-opacity duration-200 [font-variant-numeric:tabular-nums] ${
																hasQuantity ? "opacity-100" : "opacity-0"
															}`}
														>
															{quantity}
														</span>

														{/* Minus Button (Left side in RTL) */}
														<button
															onClick={() => updateQuantity(item, -1)}
															className={`flex h-8 w-8 shrink-0 items-center justify-center bg-white text-[#812f1d] rounded-full shadow-sm hover:bg-[#812f1d] hover:text-white transition-all duration-200 ml-1 ${
																hasQuantity
																	? "opacity-100 scale-100"
																	: "opacity-0 scale-50 pointer-events-none"
															}`}
														>
															<Minus className="w-3 h-3" />
														</button>
													</div>
												</div>
											</div>
										</div>
									</div>
								);
							})}

							{category.items.length === 0 && (
								<p className="text-center font-tajawal text-[#55423e] col-span-full py-4">
									لا توجد أصناف في هذه الفئة حالياً
								</p>
							)}
						</div>
					</section>
				))}

				{displayCategories.length === 0 && (
					<div className="flex flex-col items-center justify-center py-20 opacity-70">
						<Image
							src="/main-logo.png"
							alt="المخبز اللبناني"
							width={120}
							height={120}
							className="grayscale"
						/>
						<p className="font-aref-ruqaa text-2xl mt-6 text-[#55423e]">
							القائمة قيد التجهيز
						</p>
					</div>
				)}
			</main>

			{/* Floating Cart CTA */}
			{totalItems > 0 && !isCartOpen && (
				<div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-md z-40 animate-slide-up">
					<button
						onClick={() => setIsCartOpen(true)}
						className="w-full bg-[#812f1d] hover:bg-[#a04632] text-white p-4 rounded-[4px] shadow-xl shadow-[#812f1d]/20 flex items-center justify-between transition-all hover:-translate-y-1"
					>
						<div className="flex items-center gap-3">
							<div className="relative">
								<ShoppingBag className="w-6 h-6" />
								<span className="absolute -top-2 -right-2 bg-white text-[#812f1d] text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full">
									{totalItems}
								</span>
							</div>
							<span className="font-aref-ruqaa text-2xl mb-1">عاين الطلب</span>
						</div>
						<span className="font-noto-sans-arabic font-bold text-lg">
							{totalPrice.toFixed(2)} ج.م.
						</span>
					</button>
				</div>
			)}

			<BottomSheet
				isOpen={isCartOpen}
				onClose={() => setIsCartOpen(false)}
				title="السلة"
				footer={
					<div className="space-y-6">
						<div className="flex justify-between items-center">
							<span className="font-tajawal text-xl text-[#55423e]">
								الإجمالي
							</span>
							<span className="font-noto-sans-arabic font-bold text-2xl text-[#812f1d]">
								{totalPrice.toFixed(2)} ج.م.
							</span>
						</div>
						<button
							onClick={handleCheckout}
							className="w-full bg-[#812f1d] hover:bg-[#a04632] text-white py-4 rounded-[4px] font-aref-ruqaa text-3xl shadow-md transition-colors flex items-center justify-center"
						>
							إتمام الطلب
						</button>
					</div>
				}
			>
				<div className="space-y-4">
					{cartItems.map(item => (
						<div
							key={item.menuItem.id}
							className="flex justify-between items-center py-3 border-b border-[#e9e1dc] last:border-0"
						>
							<div className="flex-1 pl-4">
								<h3 className="font-aref-ruqaa text-xl text-[#1e1b18]">
									{item.menuItem.name}
								</h3>
								<p className="font-noto-sans-arabic text-sm text-[#55423e] mt-1">
									{item.menuItem.price} ج.م.
								</p>
							</div>
							<div className="flex items-center gap-2">
								<button
									onClick={() => updateQuantity(item.menuItem, -item.quantity)}
									className="w-10 h-10 flex items-center justify-center bg-[#fbf2ed] text-[#a04632] rounded-full border border-[#dcc1bb] hover:bg-[#a04632] hover:text-white transition-colors shadow-sm shrink-0"
									aria-label="إزالة"
								>
									<Trash2 className="w-4 h-4" />
								</button>
								<div className="flex items-center gap-3 bg-[#fbf2ed] p-1.5 rounded-full border border-[#dcc1bb]">
									<button
										onClick={() => updateQuantity(item.menuItem, 1)}
										className="w-8 h-8 flex items-center justify-center bg-white text-[#812f1d] rounded-full shadow hover:bg-[#812f1d] hover:text-white transition-colors"
									>
										<Plus className="w-4 h-4" />
									</button>
									<span className="font-noto-sans-arabic font-bold w-4 text-center">
										{item.quantity}
									</span>
									<button
										onClick={() => updateQuantity(item.menuItem, -1)}
										className="w-8 h-8 flex items-center justify-center bg-white text-[#812f1d] rounded-full shadow hover:bg-[#812f1d] hover:text-white transition-colors"
									>
										<Minus className="w-4 h-4" />
									</button>
								</div>
							</div>
						</div>
					))}
				</div>
			</BottomSheet>
		</div>
	);
}
