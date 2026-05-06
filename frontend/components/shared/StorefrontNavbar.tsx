import Image from "next/image";
import Link from "next/link";

export default function StorefrontNavbar() {
  return (
    <nav className="absolute top-0 w-full z-50 transition-all duration-300 bg-transparent py-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo - Right Side in RTL */}
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="flex items-center gap-3">
              <div className="relative h-12 w-12 rounded-full overflow-hidden bg-white/10 backdrop-blur-md border border-white/20 p-1">
                <div className="relative w-full h-full rounded-full overflow-hidden bg-white">
                  <Image
                    src="/main-logo.png"
                    alt="المخبز اللبناني"
                    fill
                    sizes="(max-width: 768px) 48px, 48px"
                    className="object-contain"
                    priority
                  />
                </div>
              </div>
            </Link>
          </div>

          {/* Actions - Left Side in RTL */}
          {/* <div className="flex items-center gap-4">
            <button className="text-white hover:text-primary transition-colors flex items-center gap-2 font-noto-sans-arabic text-sm bg-black/20 hover:bg-white/90 hover:text-primary px-4 py-2 rounded-full backdrop-blur-sm border border-white/10">
              <Package className="w-4 h-4" />
              <span className="hidden sm:inline">تتبع الطلب</span>
            </button>
          </div> */}
        </div>
      </div>
    </nav>
  );
}
