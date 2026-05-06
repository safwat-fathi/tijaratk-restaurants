import { Controller, Get, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RestaurantService } from './services/restaurant.service';

/** Public branches API for the restaurant storefront. */
@ApiTags('Restaurant Branches')
@Controller('branches')
export class BranchesController {
  constructor(private readonly restaurantService: RestaurantService) {}

  /** Returns active restaurant branches. */
  @Get()
  @ApiOperation({ summary: 'Get active restaurant branches' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Return branches' })
  findBranches() {
    return this.restaurantService.findBranches();
  }
}
