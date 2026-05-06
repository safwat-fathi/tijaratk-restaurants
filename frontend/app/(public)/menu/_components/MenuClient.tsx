"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowRight, Plus, Minus, ShoppingBag, X } from "lucide-react";
import { MenuCategory, MenuItem } from "@/types/models/menu";
import { useBodyScrollLock } from "@/lib/hooks/useBodyScrollLock";

type CartItem = {
  menuItem: MenuItem;
  quantity: number;
};

type MenuClientProps = {
  categories: MenuCategory[];
  branchId: string;
};

export default function MenuClient({ categories, branchId }: MenuClientProps) {
  const [cart, setCart] = useState<Record<number, CartItem>>({});
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();
  useBodyScrollLock(isCartOpen);

  // Load cart from local storage on mount
  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      const savedCart = localStorage.getItem(`tijaratk_cart_${branchId}`);
      if (savedCart) {
        try {
          setCart(JSON.parse(savedCart));
        } catch (error) {
          console.error("Failed to parse cart from local storage", error);
        }
      }

      setIsMounted(true);
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [branchId]);

  // Save cart to local storage whenever it changes
  useEffect(() => {
    if (isMounted) {
      localStorage.setItem(`tijaratk_cart_${branchId}`, JSON.stringify(cart));
    }
  }, [cart, isMounted, branchId]);

  const updateQuantity = (item: MenuItem, delta: number) => {
    setCart((prev) => {
      const currentQuantity = prev[item.id]?.quantity || 0;
      const newQuantity = currentQuantity + delta;

      if (newQuantity <= 0) {
        const newCart = { ...prev };
        delete newCart[item.id];
        if (Object.keys(newCart).length === 0) setIsCartOpen(false); // Close cart if empty
        return newCart;
      }

      return {
        ...prev,
        [item.id]: {
          menuItem: item,
          quantity: newQuantity,
        },
      };
    });
  };

  const handleCheckout = () => {
    setIsCartOpen(false);
    router.push(`/checkout?branchId=${branchId}`);
  };

  const cartItems = Object.values(cart);
  const totalItems = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const totalPrice = cartItems.reduce(
    (acc, item) => acc + Number(item.menuItem.price) * item.quantity,
    0
  );

  return (
    <div className="w-full flex flex-col bg-[#fff8f5] min-h-screen pb-32 relative">
      {/* Sticky Top App Bar */}
      <header className="sticky top-0 z-40 self-start w-full bg-[#fff8f5]/90 backdrop-blur-md border-b border-[#e9e1dc]">
        <div className="flex items-center justify-between px-4 h-16 max-w-3xl mx-auto w-full">
          <Link href="/" className="p-2 -mr-2 rounded-full hover:bg-[#f5ece7] text-[#1e1b18] transition-colors">
            <ArrowRight className="w-6 h-6" />
            <span className="sr-only">عودة</span>
          </Link>
          <h1 className="font-aref-ruqaa text-2xl text-[#812f1d]">المخبز اللبناني</h1>
          <div className="w-10"></div> {/* Spacer for centering */}
        </div>
        
        {/* Horizontal Category Bar */}
        <div className="w-full max-w-3xl mx-auto overflow-x-auto hide-scrollbar border-t border-[#e9e1dc]/50">
          <ul className="flex items-center px-4 py-3 gap-6 whitespace-nowrap font-noto-sans-arabic text-sm">
            {categories.map((category, idx) => (
              <li key={category.id}>
                <Link 
                  href={`#category-${category.id}`} 
                  className={`block px-1 pb-1 border-b-2 transition-colors ${
                    idx === 0 
                      ? "border-[#a04632] text-[#812f1d] font-bold" 
                      : "border-transparent text-[#55423e] hover:text-[#1e1b18]"
                  }`}
                >
                  {category.name}
                </Link>
              </li>
            ))}
            {categories.length === 0 && (
              <li className="text-[#55423e]">لا توجد فئات متاحة حالياً</li>
            )}
          </ul>
        </div>
      </header>

      {/* Menu Content */}
      <main className="w-full max-w-3xl mx-auto px-4 mt-6 space-y-12">
        {categories.map((category) => (
          <section key={category.id} id={`category-${category.id}`} className="scroll-mt-32 space-y-4">
            <h2 className="font-aref-ruqaa text-3xl text-[#1e1b18] text-center mb-6">
              {category.name}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {category.items.map((item) => {
                // Wait for client mount to avoid hydration mismatch
                const quantity = isMounted ? (cart[item.id]?.quantity || 0) : 0;
                return (
                  <div key={item.id} className="bg-[#ffffff] border border-[#dcc1bb] rounded-[4px] p-4 flex gap-4 shadow-sm hover:shadow-md transition-shadow">
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
                        
                        {/* Dynamic Add/Controls Button */}
                        {quantity === 0 ? (
                          <button 
                            onClick={() => updateQuantity(item, 1)}
                            className="w-8 h-8 rounded-full bg-[#fbf2ed] text-[#a04632] border border-[#dcc1bb] flex items-center justify-center hover:bg-[#a04632] hover:text-white hover:border-transparent transition-all shadow-sm"
                          >
                            <Plus className="w-4 h-4" />
                            <span className="sr-only">إضافة {item.name}</span>
                          </button>
                        ) : (
                          <div className="flex items-center gap-3 bg-[#fbf2ed] p-1 rounded-full border border-[#dcc1bb]">
                            <button
                              onClick={() => updateQuantity(item, 1)}
                              className="w-7 h-7 flex items-center justify-center bg-white text-[#812f1d] rounded-full shadow-sm hover:bg-[#812f1d] hover:text-white transition-colors"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                            <span className="font-noto-sans-arabic font-bold text-[#1e1b18] min-w-[1rem] text-center">{quantity}</span>
                            <button
                              onClick={() => updateQuantity(item, -1)}
                              className="w-7 h-7 flex items-center justify-center bg-white text-[#812f1d] rounded-full shadow-sm hover:bg-[#812f1d] hover:text-white transition-colors"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                          </div>
                        )}
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
        
        {categories.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 opacity-70">
            <Image src="/main-logo.png" alt="المخبز اللبناني" width={120} height={120} className="grayscale" />
            <p className="font-aref-ruqaa text-2xl mt-6 text-[#55423e]">القائمة قيد التجهيز</p>
          </div>
        )}
      </main>

      {/* Floating Cart CTA */}
      {(isMounted && totalItems > 0 && !isCartOpen) && (
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

      {/* Cart Bottom Sheet UI */}
      {isCartOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-50 transition-opacity duration-300"
            onClick={() => setIsCartOpen(false)}
          />
          {/* Drawer */}
          <div
            className="fixed bottom-0 left-1/2 z-50 flex max-h-[85dvh] w-full max-w-xl -translate-x-1/2 flex-col overflow-hidden rounded-t-3xl bg-[#fff8f5] p-6 shadow-2xl animate-slide-up"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="w-12 h-1.5 bg-[#dcc1bb] rounded-full mx-auto mb-6 shrink-0" />
            <div className="flex justify-between items-center mb-6 shrink-0">
              <h2 className="font-aref-ruqaa text-3xl text-[#812f1d]">السلة</h2>
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-2 bg-[#f5ece7] rounded-full text-[#55423e] hover:bg-[#e9e1dc] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div
              className="flex-1 overflow-y-auto overscroll-contain space-y-4 mb-6"
              style={{ WebkitOverflowScrolling: "touch" }}
            >
              {cartItems.map((item) => (
                <div key={item.menuItem.id} className="flex justify-between items-center py-3 border-b border-[#e9e1dc] last:border-0">
                  <div className="flex-1 pl-4">
                    <h3 className="font-aref-ruqaa text-xl text-[#1e1b18]">{item.menuItem.name}</h3>
                    <p className="font-noto-sans-arabic text-sm text-[#55423e] mt-1">{item.menuItem.price} ج.م.</p>
                  </div>
                  <div className="flex items-center gap-3 bg-[#fbf2ed] p-1.5 rounded-full border border-[#dcc1bb]">
                    <button
                      onClick={() => updateQuantity(item.menuItem, 1)}
                      className="w-8 h-8 flex items-center justify-center bg-white text-[#812f1d] rounded-full shadow hover:bg-[#812f1d] hover:text-white transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    <span className="font-noto-sans-arabic font-bold w-4 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.menuItem, -1)}
                      className="w-8 h-8 flex items-center justify-center bg-white text-[#812f1d] rounded-full shadow hover:bg-[#812f1d] hover:text-white transition-colors"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-[#dcc1bb] space-y-6 shrink-0">
              <div className="flex justify-between items-center">
                <span className="font-tajawal text-xl text-[#55423e]">الإجمالي</span>
                <span className="font-noto-sans-arabic font-bold text-2xl text-[#812f1d]">{totalPrice.toFixed(2)} ج.م.</span>
              </div>
              <button 
                onClick={handleCheckout}
                className="w-full bg-[#812f1d] hover:bg-[#a04632] text-white py-4 rounded-[4px] font-aref-ruqaa text-3xl shadow-md transition-colors flex items-center justify-center"
              >
                إتمام الطلب
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
