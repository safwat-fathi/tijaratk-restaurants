import { redirect } from "next/navigation";
import CheckoutClient from "./_components/CheckoutClient";
import { deliveryServicesService } from "@/services/api/delivery-services.service";

type CheckoutPageProps = {
  searchParams: Promise<{ branchId?: string }>;
};

async function getDeliveryServices(branchId: string) {
  try {
    const response = await deliveryServicesService.getBranchDeliveryServices(branchId);

    if (response.success && response.data) {
      return response.data;
    }

    return [];
  } catch {
    return [];
  }
}

export default async function CheckoutPage(props: CheckoutPageProps) {
  const searchParams = await props.searchParams;
  
  if (!searchParams.branchId) {
    redirect("/");
  }

  const deliveryServices = await getDeliveryServices(searchParams.branchId);

  return (
    <CheckoutClient
      branchId={searchParams.branchId}
      deliveryServices={deliveryServices}
    />
  );
}
