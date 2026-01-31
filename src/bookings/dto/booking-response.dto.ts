import { ApiProperty } from '@nestjs/swagger';

export class BookingResponseDto {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  userId!: number;

  @ApiProperty({ type: String, format: 'date-time' })
  startTime!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  endTime!: string;

  @ApiProperty()
  country!: string;

  @ApiProperty()
  city!: string;

  @ApiProperty()
  department!: string;

  @ApiProperty()
  house!: string;

  @ApiProperty()
  cancelled!: boolean;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: string;
}
