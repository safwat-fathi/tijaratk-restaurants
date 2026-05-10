import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MvpOrderStatus } from 'src/generated/prisma/enums';
import { PosSqlService } from 'src/pos/pos-sql.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateRestaurantOrderDto } from '../dto/create-restaurant-order.dto';
import { RestaurantService } from './restaurant.service';

/** Handles restaurant order persistence and POS export. */
@Injectable()
export class RestaurantOrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly posSqlService: PosSqlService,
    private readonly restaurantService: RestaurantService,
  ) {}

  /** Retrieves an order by ID for a specific branch. */
  async getOrderById(branchId: number, orderId: number) {
    const order = await this.prisma.mvpOrder.findFirst({
      where: {
        id: orderId,
        branchId,
      },
      include: {
        items: true,
      },
    });

    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }

    return order;
  }

  /** Creates a local order and immediately exports its items to POS. */
  async createOrder(branchId: number, dto: CreateRestaurantOrderDto) {
    await this.restaurantService.assertBranchExists(branchId);
    const menuItemIds = dto.items.map((item) => item.menuItemId);

    const [menuItems, deliveryService] = await Promise.all([
      this.prisma.menuItem.findMany({
        where: { id: { in: menuItemIds }, isActive: true, deletedAt: null },
      }),
      this.prisma.deliveryService.findFirst({
        where: {
          branchId,
          posDeliveryServiceCode: dto.deliveryServiceCode,
          isActive: true,
          deletedAt: null,
        },
      }),
    ]);

    const menuItemsById = new Map(
      menuItems.map((menuItem) => [menuItem.id, menuItem]),
    );
    const missingMenuItemId = menuItemIds.find(
      (menuItemId) => !menuItemsById.has(menuItemId),
    );

    if (missingMenuItemId) {
      throw new NotFoundException(`Menu item ${missingMenuItemId} not found`);
    }
    if (!deliveryService) {
      throw new BadRequestException('Invalid delivery service for branch');
    }

    const customerName = dto.customerName.trim();
    const customerMobile = dto.customerMobile.trim();
    const customerAddress = dto.customerAddress.trim();
    const normalizedCustomerMobile =
      this.normalizeCustomerPhone(customerMobile);
    const remarks = dto.remarks?.trim() ?? '';

    const order = await this.prisma.$transaction(async (tx) => {
      const customer = await tx.customer.upsert({
        where: { phone: normalizedCustomerMobile },
        update: {
          phoneRaw: customerMobile,
          name: customerName,
        },
        create: {
          phone: normalizedCustomerMobile,
          phoneRaw: customerMobile,
          name: customerName,
        },
      });

      const customerAddressRecord = await tx.customerAddress.upsert({
        where: {
          customerId_address: {
            customerId: customer.id,
            address: customerAddress,
          },
        },
        update: {
          usageCount: { increment: 1 },
          lastUsedAt: new Date(),
        },
        create: {
          customerId: customer.id,
          address: customerAddress,
          usageCount: 1,
          lastUsedAt: new Date(),
        },
      });

      return tx.mvpOrder.create({
        data: {
          branchId,
          customerId: customer.id,
          customerAddressId: customerAddressRecord.id,
          customerName,
          customerMobile,
          customerAddress,
          deliveryServiceCode: dto.deliveryServiceCode,
          remarks: remarks || null,
          total: dto.total,
          items: {
            create: dto.items.map((item) => {
              const menuItem = menuItemsById.get(item.menuItemId)!;
              const unitPrice = Number(menuItem.price);
              const itemRemarks = item.remarks?.trim() ?? '';

              return {
                menuItemId: menuItem.id,
                posOrderCode: menuItem.posOrderCode,
                nameSnapshot: menuItem.name,
                quantity: item.quantity,
                remarks: itemRemarks || null,
                unitPrice: menuItem.price,
                totalPrice: unitPrice * item.quantity,
              };
            }),
          },
        },
        include: { items: true },
      });
    });

    try {
      for (const item of dto.items) {
        const menuItem = menuItemsById.get(item.menuItemId)!;
        const itemRemarks = item.remarks?.trim() ?? '';

        await this.posSqlService.addCustomerOrder({
          customerName: order.customerName,
          customerMobile: order.customerMobile,
          customerAddress: order.customerAddress,
          deliveryServiceCode: order.deliveryServiceCode,
          orderCode: menuItem.posOrderCode,
          orderQty: item.quantity,
          orderRemarks: this.buildPosOrderRemarks(itemRemarks, remarks),
        });
      }

      return this.prisma.mvpOrder.update({
        where: { id: order.id },
        data: {
          status: MvpOrderStatus.exported_to_pos,
          posExportAttempts: { increment: 1 },
          posLastExportError: null,
        },
        include: { items: true },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await this.prisma.mvpOrder.update({
        where: { id: order.id },
        data: {
          status: MvpOrderStatus.pos_export_failed,
          posExportAttempts: { increment: 1 },
          posLastExportError: message,
        },
      });
      throw error;
    }
  }

  /** Combines per-item and whole-order notes for POS item export. */
  private buildPosOrderRemarks(
    itemRemarks: string,
    orderRemarks: string,
  ): string {
    if (itemRemarks && orderRemarks) {
      return `ملاحظة الصنف: ${itemRemarks} | ملاحظة الطلب: ${orderRemarks}`;
    }

    return itemRemarks || orderRemarks;
  }

  /** Normalizes customer phones before customer upsert. */
  private normalizeCustomerPhone(phone: string): string {
    const normalizedPhone = phone.trim();
    if (!normalizedPhone) {
      return normalizedPhone;
    }

    const cleaned = normalizedPhone.replace(/[^\d+]/g, '');
    if (cleaned.startsWith('+20')) {
      return cleaned;
    }

    if (cleaned.startsWith('20') && cleaned.length >= 12) {
      return `+${cleaned}`;
    }

    if (cleaned.startsWith('01') && cleaned.length === 11) {
      return `+20${cleaned.substring(1)}`;
    }

    return cleaned;
  }
}
