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

  /** Creates a local single-item order and immediately exports it to POS. */
  async createOrder(branchId: number, dto: CreateRestaurantOrderDto) {
    await this.restaurantService.assertBranchExists(branchId);

    const [menuItem, deliveryService] = await Promise.all([
      this.prisma.menuItem.findFirst({
        where: { id: dto.menuItemId, isActive: true, deletedAt: null },
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

    if (!menuItem) {
      throw new NotFoundException(`Menu item ${dto.menuItemId} not found`);
    }
    if (!deliveryService) {
      throw new BadRequestException('Invalid delivery service for branch');
    }

    const order = await this.prisma.mvpOrder.create({
      data: {
        branchId,
        customerName: dto.customerName.trim(),
        customerMobile: dto.customerMobile.trim(),
        customerAddress: dto.customerAddress.trim(),
        deliveryServiceCode: dto.deliveryServiceCode,
        total: dto.total,
        items: {
          create: {
            menuItemId: menuItem.id,
            posOrderCode: menuItem.posOrderCode,
            nameSnapshot: menuItem.name,
            unitPrice: menuItem.price,
            totalPrice: dto.total,
          },
        },
      },
      include: { items: true },
    });

    try {
      await this.posSqlService.addCustomerOrder({
        customerName: order.customerName,
        customerMobile: order.customerMobile,
        customerAddress: order.customerAddress,
        deliveryServiceCode: order.deliveryServiceCode,
        orderCode: menuItem.posOrderCode,
      });

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
