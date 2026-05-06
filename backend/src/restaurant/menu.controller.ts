import {
  Controller,
  Get,
  HttpStatus,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RestaurantService } from './services/restaurant.service';

/** Public menu API for the restaurant storefront. */
@ApiTags('Restaurant Menu')
@Controller('branches/:branchId/menu')
export class MenuController {
  constructor(private readonly restaurantService: RestaurantService) {}

  /** Returns shared menu for a branch. */
  @Get()
  @ApiOperation({ summary: 'Get branch menu' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return menu categories and items',
  })
  findMenu(@Param('branchId', ParseIntPipe) branchId: number) {
    return this.restaurantService.findMenu(branchId);
  }
}
