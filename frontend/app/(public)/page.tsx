import Image from "next/image";

import StorefrontBranchSelector from "./_components/StorefrontBranchSelector";
import { branchesService } from "@/services/api/branches.service";
import { deliveryServicesService } from "@/services/api/delivery-services.service";
import { DeliveryService } from "@/types/models/delivery-service";

type BranchDeliveryServicesEntry = {
  branchId: string;
  services: DeliveryService[];
  hasError: boolean;
};

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

async function getDeliveryServicesByBranch(branchIds: number[]) {
  const deliveryServicesByBranch: BranchDeliveryServicesEntry[] = [];

  await Promise.all(
    branchIds.map(async (branchId) => {
      const branchIdAsString = String(branchId);
      try {
        const response = await deliveryServicesService.getBranchDeliveryServices(branchId);
        if (response.success && response.data) {
          deliveryServicesByBranch.push({
            branchId: branchIdAsString,
            services: response.data,
            hasError: false,
          });
          return;
        }
      } catch {
        // handled below by setting an empty list + branch error marker
      }

      deliveryServicesByBranch.push({
        branchId: branchIdAsString,
        services: [],
        hasError: true,
      });
    }),
  );

  return deliveryServicesByBranch;
}

export default async function StorefrontPage() {
  const { branches, hasBranchesError } = await getBranches();
  const deliveryServicesByBranch = await getDeliveryServicesByBranch(
    branches.map((branch) => branch.id),
  );

  return (
		<div className="w-full flex flex-col items-center">
			{/* Fixed Background Layer (Parallax effect base) */}
			<div className="fixed top-0 left-0 w-full h-[35vh] min-h-[250px] bg-[#34302c] z-0 pointer-events-none">
				<Image
					src="/cover.png"
					alt="من قلب بيروت .. للقاهرة"
					fill
					className="object-cover opacity-70 mix-blend-overlay"
					priority
					sizes="100vw"
				/>
				{/* Dark gradient overlay to make logo pop */}
				<div className="absolute inset-0 bg-linear-to-t from-[#1e1b18]/60 via-transparent to-transparent"></div>
			</div>

			{/* Spacer to push content down below the fixed hero, keeping the logo layered correctly */}
			<div className="relative w-full h-[35vh] min-h-[250px] bg-transparent z-20 pointer-events-none">
				{/* Brand Info Layered over Hero - absolute to the spacer so it scrolls with the page */}
				<div className="absolute bottom-0 left-0 right-0 p-8 flex flex-col items-center translate-y-1/2 z-20 pointer-events-auto">
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

			{/* Main Content Area (Scrolls over the parallax background) */}
			<div className="relative w-full bg-[#fff8f5] z-10 flex flex-col items-center pt-20 md:pt-24 pb-16 min-h-[65vh]">
				<div className="w-full max-w-3xl px-4 sm:px-6 space-y-10">
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
						deliveryServicesByBranch={deliveryServicesByBranch}
					/>
				</div>
			</div>
		</div>
	);
}
