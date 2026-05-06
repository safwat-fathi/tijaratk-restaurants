import Link from "next/link";

export default function StorefrontFooter() {
  return (
    <footer className="w-full bg-[#fbf2ed] border-t border-[#dcc1bb] py-8 mt-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center gap-4">
        
        <div className="flex items-center justify-center gap-6 font-noto-sans-arabic text-sm text-[#55423e]">
          <Link href="#" className="hover:text-[#812f1d] transition-colors">
            تتبع الطلب
          </Link>
          <div className="w-1 h-1 rounded-full bg-[#dcc1bb]"></div>
          <Link href="#" className="hover:text-[#812f1d] transition-colors">
            تواصل معنا
          </Link>
        </div>

        <div className="space-y-1 font-noto-sans-arabic text-xs text-[#89726d]">
          <p>الأسعار والقائمة محدثة مباشرة من نقطة البيع للفرع</p>
          <p>يتم تأكيد الإجمالي النهائي عند الدفع</p>
        </div>

        <div className="mt-4 pt-4 border-t border-[#dcc1bb]/50 w-full font-noto-sans-arabic text-xs text-[#89726d]">
          &copy; {new Date().getFullYear()} المخبز اللبناني. جميع الحقوق محفوظة.
        </div>
      </div>
    </footer>
  );
}
