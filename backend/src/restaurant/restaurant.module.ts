import { Module } from '@nestjs/common';
import { PosModule } from 'src/pos/pos.module';
import { BranchesController } from './branches.controller';
import { BrandController } from './brand.controller';
import { CustomersController } from './customers.controller';
import { DeliveryServicesController } from './delivery-services.controller';
import { MenuController } from './menu.controller';
import { OrdersController } from './orders.controller';
import { RestaurantOrdersService } from './services/restaurant-orders.service';
import { RestaurantService } from './services/restaurant.service';

/** Wires public restaurant storefront APIs. */
@Module({
  imports: [PosModule],
  controllers: [
    BrandController,
    BranchesController,
    CustomersController,
    DeliveryServicesController,
    MenuController,
    OrdersController,
  ],
  providers: [RestaurantService, RestaurantOrdersService],
})
export class RestaurantModule {}
