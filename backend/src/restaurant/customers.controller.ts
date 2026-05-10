import {
  Controller,
  Get,
  HttpStatus,
  Param,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { LookupRestaurantCustomerDto } from './dto/lookup-restaurant-customer.dto';
import { RestaurantService } from './services/restaurant.service';

/** Public customer helpers for the restaurant storefront. */
@ApiTags('Restaurant Customers')
@Controller('branches/:branchId/customers')
export class CustomersController {
  constructor(private readonly restaurantService: RestaurantService) {}

  /** Looks up recent customer details by phone for checkout autofill. */
  @Get('lookup')
  @ApiOperation({ summary: 'Lookup a restaurant customer by phone' })
  @ApiQuery({ name: 'phone', type: String, example: '01023314587' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return matching customer profile and saved addresses',
  })
  lookupCustomer(
    @Param('branchId', ParseIntPipe) branchId: number,
    @Query() query: LookupRestaurantCustomerDto,
  ) {
    return this.restaurantService.lookupCustomerByPhone(branchId, query.phone);
  }
}
