import {
  Body,
  Controller,
  Param,
  ParseIntPipe,
  Post,
  Delete,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('bookings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  create(@Req() req: any, @Body() dto: CreateBookingDto) {
    return this.bookingsService.create(req.user.userId, dto);
  }

  @Delete(':id')
  cancel(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    const isAdmin = req.user.role === 'ADMIN';
    return this.bookingsService.cancel(id, req.user.userId, isAdmin);
  }
}
