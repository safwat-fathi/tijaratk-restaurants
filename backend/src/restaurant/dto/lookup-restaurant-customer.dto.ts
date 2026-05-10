import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';

/** Query DTO for looking up a restaurant customer by phone. */
export class LookupRestaurantCustomerDto {
  @ApiProperty({ example: '01023314587' })
  @IsString()
  @MaxLength(32)
  phone: string;
}
