export type DeliveryService = {
  id: number;
  branchId: number;
  posDeliveryServiceCode: number;
  name: string;
  amount: number | string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};
