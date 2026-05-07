"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Loader2, CheckCircle2 } from "lucide-react";
import { clearCartAction } from "@/actions/cart-actions";
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
  const router = useRouter();
  const [formData, setFormData] = useState({
    customerName: "",
    customerMobile: "",
    customerAddress: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cartItems = initialCartItems;
  const totalPrice = cartItems.reduce(
    (acc, item) => acc + Number(item.menuItem.price) * item.quantity,
    0
  );

  const deliveryFee = Number(selectedDeliveryService.amount) || 0;
  const finalTotal = totalPrice + deliveryFee;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cartItems.length === 0) return;

    setIsSubmitting(true);
    setError(null);

    // MVP constraint: Backend only supports a single item per order. 
    // We send the first item in the cart.
    const primaryItem = cartItems[0].menuItem;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'}/branches/${branchId}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerName: formData.customerName,
          customerMobile: formData.customerMobile,
          customerAddress: formData.customerAddress,
          deliveryServiceCode: selectedDeliveryService.posDeliveryServiceCode,
          menuItemId: primaryItem.id,
          total: finalTotal, // Send total order price including delivery
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'فشل في إرسال الطلب');
      }

      // Success
      await clearCartAction();
      setIsSuccess(true);
      
      // Redirect after 3 seconds
      setTimeout(() => {
        router.push(`/track-orders?mobile=${formData.customerMobile}`);
      }, 3000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل في إرسال الطلب');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-[#fff8f5] flex flex-col items-center justify-center p-4 text-center">
        <CheckCircle2 className="w-20 h-20 text-green-600 mb-6" />
        <h1 className="font-aref-ruqaa text-4xl text-[#1e1b18] mb-2">تم استلام طلبك بنجاح!</h1>
        <p className="font-tajawal text-lg text-[#55423e] mb-8">
          جاري تجهيز طلبك. سيتم تحويلك لصفحة متابعة الطلب...
        </p>
      </div>
    );
  }

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
            <span className="font-noto-sans-arabic font-bold">{totalPrice.toFixed(2)} ج.م.</span>
          </div>
          <div className="flex justify-between items-center pt-2 text-sm font-tajawal text-[#55423e]">
            <span>منطقة التوصيل</span>
            <span>{selectedDeliveryService.name}</span>
          </div>
          <div className="flex justify-between items-center pt-2 pb-4 text-sm font-tajawal text-[#55423e] border-b border-[#f5ece7]">
            <span>رسوم التوصيل</span>
            <span className="font-noto-sans-arabic font-bold">{deliveryFee.toFixed(2)} ج.م.</span>
          </div>
          <div className="flex justify-between items-center pt-4">
            <span className="font-tajawal font-bold text-lg text-[#1e1b18]">الإجمالي النهائي</span>
            <span className="font-noto-sans-arabic font-bold text-xl text-[#812f1d]">{finalTotal.toFixed(2)} ج.م.</span>
          </div>
        </section>

        {/* Checkout Form */}
        <section className="bg-white border border-[#e9e1dc] rounded-xl p-5 shadow-sm">
          <h2 className="font-aref-ruqaa text-2xl text-[#1e1b18] mb-6">بيانات التوصيل</h2>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm font-tajawal">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="customerName" className="block text-sm font-bold text-[#1e1b18] font-tajawal">الاسم</label>
              <input 
                type="text" 
                id="customerName" 
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
                required
                rows={3}
                value={formData.customerAddress}
                onChange={(e) => setFormData({...formData, customerAddress: e.target.value})}
                className="w-full p-3 border border-[#dcc1bb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#812f1d]/50 focus:border-[#812f1d] font-tajawal text-[#1e1b18] bg-[#fdfaf8] resize-none"
                placeholder="أدخل عنوان التوصيل بالتفصيل (الحي، المجاورة، الشارع، رقم العمارة)"
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
