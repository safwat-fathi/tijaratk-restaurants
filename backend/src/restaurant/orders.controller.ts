import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateRestaurantOrderDto } from './dto/create-restaurant-order.dto';
import { RestaurantOrdersService } from './services/restaurant-orders.service';

/** Public order API for the restaurant storefront. */
@ApiTags('Restaurant Orders')
@Controller('branches/:branchId/orders')
export class OrdersController {
  constructor(
    private readonly restaurantOrdersService: RestaurantOrdersService,
  ) {}

  /** Retrieves a branch order by ID. */
  @Get(':orderId')
  @ApiOperation({ summary: 'Get a branch order by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Order details including items',
  })
  getOrder(
    @Param('branchId', ParseIntPipe) branchId: number,
    @Param('orderId', ParseIntPipe) orderId: number,
  ) {
    return this.restaurantOrdersService.getOrderById(branchId, orderId);
  }

  /** Creates a branch order and exports it to POS. */
  @Post()
  @ApiOperation({ summary: 'Create a branch order' })
  @ApiBody({ type: CreateRestaurantOrderDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Order created and exported to POS',
  })
  createOrder(
    @Param('branchId', ParseIntPipe) branchId: number,
    @Body() dto: CreateRestaurantOrderDto,
  ) {
    return this.restaurantOrdersService.createOrder(branchId, dto);
  }
}
