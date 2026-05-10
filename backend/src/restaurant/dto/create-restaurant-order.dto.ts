import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

/** DTO for a submitted restaurant order item. */
export class CreateRestaurantOrderItemDto {
  @ApiProperty({ example: 100 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  menuItemId: number;

  @ApiProperty({ example: 2 })
  @Type(() => Number)
  @IsNumber()
  @Min(0.001)
  quantity: number;

  @ApiProperty({ example: 'بدون سمسم', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  remarks?: string;
}

/** DTO for creating a restaurant order from checkout. */
export class CreateRestaurantOrderDto {
  @ApiProperty({ example: 'صفوت فتحي' })
  @IsString()
  @MaxLength(120)
  customerName: string;

  @ApiProperty({ example: '01023314587' })
  @IsString()
  @MaxLength(32)
  customerMobile: string;

  @ApiProperty({ example: 'الحي4 - مجاورة7' })
  @IsString()
  @MaxLength(255)
  customerAddress: string;

  @ApiProperty({ example: 50 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  deliveryServiceCode: number;

  @ApiProperty({ type: [CreateRestaurantOrderItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateRestaurantOrderItemDto)
  items: CreateRestaurantOrderItemDto[];

  @ApiProperty({ example: 'بدون مخلل', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  remarks?: string;

  @ApiProperty({ example: 150 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  total: number;
}
