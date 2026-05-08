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

    const remarks = dto.remarks?.trim() ?? '';

    const order = await this.prisma.mvpOrder.create({
      data: {
        branchId,
        customerName: dto.customerName.trim(),
        customerMobile: dto.customerMobile.trim(),
        customerAddress: dto.customerAddress.trim(),
        deliveryServiceCode: dto.deliveryServiceCode,
        remarks: remarks || null,
        total: dto.total,
        items: {
          create: dto.items.map((item) => {
            const menuItem = menuItemsById.get(item.menuItemId)!;
            const unitPrice = Number(menuItem.price);

            return {
              menuItemId: menuItem.id,
              posOrderCode: menuItem.posOrderCode,
              nameSnapshot: menuItem.name,
              quantity: item.quantity,
              unitPrice: menuItem.price,
              totalPrice: unitPrice * item.quantity,
            };
          }),
        },
      },
      include: { items: true },
    });

    try {
      for (const item of dto.items) {
        const menuItem = menuItemsById.get(item.menuItemId)!;

        await this.posSqlService.addCustomerOrder({
          customerName: order.customerName,
          customerMobile: order.customerMobile,
          customerAddress: order.customerAddress,
          deliveryServiceCode: order.deliveryServiceCode,
          orderCode: menuItem.posOrderCode,
          orderQty: item.quantity,
          orderRemarks: remarks,
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
}
