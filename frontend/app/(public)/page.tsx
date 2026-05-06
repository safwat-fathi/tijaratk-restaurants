import Image from "next/image";

import StorefrontBranchSelector from "./_components/StorefrontBranchSelector";
import { branchesService } from "@/services/api/branches.service";

async function getBranches() {
  try {
    const response = await branchesService.getBranches();

    if (response.success && response.data) {
      return { branches: response.data, hasBranchesError: false };
    }

    return { branches: [], hasBranchesError: true };
  } catch {
    return { branches: [], hasBranchesError: true };
  }
}

export default async function StorefrontPage() {
  const { branches, hasBranchesError } = await getBranches();

  return (
    <div className="w-full flex flex-col items-center">
      {/* Hero Section */}
      <div className="relative w-full h-[35vh] min-h-[250px] bg-[#34302c]">
        <Image
          src="/cover.png"
          alt="من قلب بيروت .. للقاهرة"
          fill
          className="object-cover opacity-70 mix-blend-overlay"
          priority
          sizes="100vw"
        />
        {/* Dark gradient overlay to make logo pop */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#1e1b18]/60 via-transparent to-transparent"></div>
        
        {/* Brand Info Layered over Hero */}
        <div className="absolute bottom-0 left-0 right-0 p-8 flex flex-col items-center translate-y-1/2">
          <div className="relative w-32 h-32 md:w-36 md:h-36 rounded-full overflow-hidden border-4 border-[#fff8f5] bg-white shadow-xl shadow-[#1e1b18]/10 flex items-center justify-center p-2">
            <div className="relative w-full h-full">
              <Image 
                src="/main-logo.png" 
                alt="المخبز اللبناني"
                fill
                className="object-contain"
                sizes="(max-width: 768px) 128px, 144px"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="w-full max-w-3xl px-4 sm:px-6 mt-20 md:mt-24 space-y-10 pb-16">
        {/* Title and Tagline */}
        <div className="text-center space-y-2">
          <h1 className="font-aref-ruqaa text-4xl md:text-5xl lg:text-6xl text-[#812f1d]">
            المخبز اللبناني
          </h1>
          <p className="font-tajawal text-lg md:text-xl text-[#55423e]">
            مخبز لبناني أصيل
          </p>
        </div>

        <StorefrontBranchSelector
          branches={branches}
          hasBranchesError={hasBranchesError}
        />

      </div>
    </div>
  );
}
