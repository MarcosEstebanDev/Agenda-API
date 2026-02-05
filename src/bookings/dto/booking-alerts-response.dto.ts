import { ApiProperty } from '@nestjs/swagger';
import { BookingResponseDto } from './booking-response.dto';

export class BookingAlertsResponseDto {
  @ApiProperty({ type: [BookingResponseDto] })
  ongoing!: BookingResponseDto[];

  @ApiProperty({ type: [BookingResponseDto] })
  upcoming!: BookingResponseDto[];
}
