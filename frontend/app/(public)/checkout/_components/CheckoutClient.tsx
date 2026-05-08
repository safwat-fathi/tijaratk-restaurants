"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { ArrowRight, Loader2 } from "lucide-react";
import { submitCheckoutOrderAction } from "@/actions/checkout-actions";
import { MenuItem } from "@/types/models/menu";
import { DeliveryService } from "@/types/models/delivery-service";

type CartItem = {
  menuItem: MenuItem;
  quantity: number;
};

type CheckoutClientProps = {
  branchId: string;
  deliveryServiceCode: string;
  selectedDeliveryService: DeliveryService;
  initialCartItems: CartItem[];
};

export default function CheckoutClient({
  branchId,
  deliveryServiceCode,
  selectedDeliveryService,
  initialCartItems,
}: CheckoutClientProps) {
  const [formData, setFormData] = useState({
    customerName: "",
    customerMobile: "",
    customerAddress: "",
    remarks: "",
  });
  const [state, formAction, isSubmitting] = useActionState(
    submitCheckoutOrderAction,
    { success: false },
  );

  const cartItems = initialCartItems;
  const subtotal = cartItems.reduce(
    (acc, item) => acc + Number(item.menuItem.price) * item.quantity,
    0
  );

  const deliveryFee = Number(selectedDeliveryService.amount) || 0;
  const vatRate = 0.14;
  const vatAmount = (subtotal + deliveryFee) * vatRate;
  const finalTotal = subtotal + deliveryFee + vatAmount;
  const checkoutItems = JSON.stringify(
    cartItems.map((item) => ({
      menuItemId: item.menuItem.id,
      quantity: item.quantity,
    }))
  );

  return (
    <div className="w-full flex flex-col bg-[#fff8f5] min-h-screen pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full bg-[#fff8f5]/90 backdrop-blur-md border-b border-[#e9e1dc]">
        <div className="flex items-center justify-between px-4 h-16 max-w-2xl mx-auto w-full">
          <Link
            href={`/menu?branchId=${branchId}&deliveryServiceCode=${deliveryServiceCode}`}
            className="p-2 -mr-2 rounded-full hover:bg-[#f5ece7] text-[#1e1b18] transition-colors"
          >
            <ArrowRight className="w-6 h-6" />
            <span className="sr-only">عودة للقائمة</span>
          </Link>
          <h1 className="font-aref-ruqaa text-2xl text-[#812f1d]">إتمام الطلب</h1>
          <div className="w-10"></div>
        </div>
      </header>

      <main className="w-full max-w-2xl mx-auto px-4 mt-6 space-y-8">
        {/* Order Summary */}
        <section className="bg-white border border-[#e9e1dc] rounded-xl p-5 shadow-sm">
          <h2 className="font-aref-ruqaa text-2xl text-[#1e1b18] mb-4 pb-4 border-b border-[#f5ece7]">ملخص الطلب</h2>
          <div className="space-y-3 mb-4">
            {cartItems.map((item) => (
              <div key={item.menuItem.id} className="flex justify-between text-sm font-tajawal">
                <div className="flex items-center gap-2 text-[#1e1b18]">
                  <span>{item.menuItem.name}</span>
                  <span className="text-[#812f1d] font-bold" dir="ltr">{item.quantity}x</span>
                </div>
                <span className="font-noto-sans-arabic font-bold text-[#55423e]">{(Number(item.menuItem.price) * item.quantity).toFixed(2)} ج.م.</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between items-center pt-4 border-t border-[#f5ece7] text-sm font-tajawal text-[#55423e]">
            <span>المجموع</span>
            <span className="font-noto-sans-arabic font-bold">{subtotal.toFixed(2)} ج.م.</span>
          </div>
          <div className="flex justify-between items-center pt-2 text-sm font-tajawal text-[#55423e]">
            <span>منطقة التوصيل</span>
            <span>{selectedDeliveryService.name}</span>
          </div>
          <div className="flex justify-between items-center pt-2 text-sm font-tajawal text-[#55423e]">
            <span>رسوم التوصيل</span>
            <span className="font-noto-sans-arabic font-bold">{deliveryFee.toFixed(2)} ج.م.</span>
          </div>
          <div className="flex justify-between items-center pt-2 pb-4 text-sm font-tajawal text-[#55423e] border-b border-[#f5ece7]">
            <span>ضريبة القيمة المضافة (14%)</span>
            <span className="font-noto-sans-arabic font-bold">{vatAmount.toFixed(2)} ج.م.</span>
          </div>
          <div className="flex justify-between items-center pt-4">
            <span className="font-tajawal font-bold text-lg text-[#1e1b18]">الإجمالي النهائي</span>
            <span className="font-noto-sans-arabic font-bold text-xl text-[#812f1d]">{finalTotal.toFixed(2)} ج.م.</span>
          </div>
        </section>

        {/* Checkout Form */}
        <section className="bg-white border border-[#e9e1dc] rounded-xl p-5 shadow-sm">
          <h2 className="font-aref-ruqaa text-2xl text-[#1e1b18] mb-6">بيانات التوصيل</h2>
          
          <form action={formAction} className="space-y-5">
            <input type="hidden" name="branchId" value={branchId} />
            <input type="hidden" name="deliveryServiceCode" value={deliveryServiceCode} />
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

            <div className="space-y-2">
              <label htmlFor="customerName" className="block text-sm font-bold text-[#1e1b18] font-tajawal">الاسم</label>
              <input 
                type="text" 
                id="customerName" 
                name="customerName"
                required
                value={formData.customerName}
                onChange={(e) => setFormData({...formData, customerName: e.target.value})}
                className="w-full p-3 border border-[#dcc1bb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#812f1d]/50 focus:border-[#812f1d] font-tajawal text-[#1e1b18] bg-[#fdfaf8]"
                placeholder="أدخل اسمك بالكامل"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="customerMobile" className="block text-sm font-bold text-[#1e1b18] font-tajawal">رقم الهاتف</label>
              <input 
                type="tel" 
                id="customerMobile" 
                name="customerMobile"
                required
                value={formData.customerMobile}
                onChange={(e) => setFormData({...formData, customerMobile: e.target.value})}
                className="w-full p-3 border border-[#dcc1bb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#812f1d]/50 focus:border-[#812f1d] font-tajawal text-[#1e1b18] bg-[#fdfaf8]"
                placeholder="مثال: 01143341684"
                dir="ltr"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="customerAddress" className="block text-sm font-bold text-[#1e1b18] font-tajawal">عنوان التوصيل</label>
              <textarea 
                id="customerAddress" 
                name="customerAddress"
                required
                rows={3}
                value={formData.customerAddress}
                onChange={(e) => setFormData({...formData, customerAddress: e.target.value})}
                className="w-full p-3 border border-[#dcc1bb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#812f1d]/50 focus:border-[#812f1d] font-tajawal text-[#1e1b18] bg-[#fdfaf8] resize-none"
                placeholder="أدخل عنوان التوصيل بالتفصيل (الحي، المجاورة، الشارع، رقم العمارة)"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="remarks" className="block text-sm font-bold text-[#1e1b18] font-tajawal">ملاحظات الطلب</label>
              <textarea
                id="remarks"
                name="remarks"
                rows={2}
                maxLength={200}
                value={formData.remarks}
                onChange={(e) => setFormData({...formData, remarks: e.target.value})}
                className="w-full p-3 border border-[#dcc1bb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#812f1d]/50 focus:border-[#812f1d] font-tajawal text-[#1e1b18] bg-[#fdfaf8] resize-none"
                placeholder="مثال: بدون مخلل أو أي ملاحظات إضافية"
              />
            </div>

            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full mt-8 bg-[#812f1d] hover:bg-[#a04632] disabled:bg-[#dcc1bb] disabled:cursor-not-allowed text-white py-4 rounded-[4px] font-aref-ruqaa text-2xl shadow-md transition-colors flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  جاري الإرسال...
                </>
              ) : (
                "تأكيد الطلب"
              )}
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}
