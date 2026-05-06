import { Controller, Get, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RestaurantService } from './services/restaurant.service';

/** Public brand API for the restaurant storefront. */
@ApiTags('Restaurant Brand')
@Controller('brand')
export class BrandController {
  constructor(private readonly restaurantService: RestaurantService) {}

  /** Returns restaurant brand metadata. */
  @Get()
  @ApiOperation({ summary: 'Get restaurant brand metadata' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Return brand metadata' })
  getBrand() {
    return this.restaurantService.getBrand();
  }
}
