import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNumber, IsString, MaxLength, Min } from 'class-validator';

/** DTO for creating a single-item restaurant order. */
export class CreateRestaurantOrderDto {
  @ApiProperty({ example: 'صفوت فتحي' })
  @IsString()
  @MaxLength(120)
  customerName: string;

  @ApiProperty({ example: '01143341684' })
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

  @ApiProperty({ example: 100 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  menuItemId: number;

  @ApiProperty({ example: 150 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  total: number;
}
