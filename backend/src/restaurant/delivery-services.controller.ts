import {
  Controller,
  Get,
  HttpStatus,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RestaurantService } from './services/restaurant.service';

/** Public delivery services API for the restaurant storefront. */
@ApiTags('Restaurant Delivery Services')
@Controller('branches/:branchId/delivery-services')
export class DeliveryServicesController {
  constructor(private readonly restaurantService: RestaurantService) {}

  /** Returns active delivery services available for a branch. */
  @Get()
  @ApiOperation({ summary: 'Get branch delivery services' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return branch delivery services',
  })
  findDeliveryServices(@Param('branchId', ParseIntPipe) branchId: number) {
    return this.restaurantService.findDeliveryServices(branchId);
  }
}
