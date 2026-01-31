import { Body, Controller, Param, ParseIntPipe, Post, Delete, Get, Patch, Req, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiQuery, ApiTags } from '@nestjs/swagger';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { BookingResponseDto } from './dto/booking-response.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

// Basic controller to handle booking-related HTTP requests
@ApiTags('bookings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('bookings')
export class BookingsController {
  // Inject main service used by this controller
  constructor(private readonly bookingsService: BookingsService) {}

  @Get('me')
  // Returns bookings for the currently authenticated user
  @ApiOkResponse({ type: [BookingResponseDto], description: 'Reservas del usuario autenticado' })
  @ApiQuery({ name: 'from', type: Date, required: false, description: 'Fecha/hora inicial' })
  @ApiQuery({ name: 'to', type: Date, required: false, description: 'Fecha/hora final' })
  findMyBookings(
    @Req() req: any,
    @Query('from') from?: Date,
    @Query('to') to?: Date,
  ) {
    return this.bookingsService.findForUser(req.user.userId, from, to);
  }

  @Get()
  // Returns all bookings, usually restricted to admin users
  @ApiOkResponse({ type: [BookingResponseDto], description: 'Todas las reservas (solo admin)' })
  @ApiQuery({ name: 'from', type: Date, required: false, description: 'Fecha/hora inicial' })
  @ApiQuery({ name: 'to', type: Date, required: false, description: 'Fecha/hora final' })
  findAll(
    @Req() req: any,
    @Query('from') from?: Date,
    @Query('to') to?: Date,
  ) {
    const isAdmin = req.user.role === 'ADMIN';
    return this.bookingsService.findAll(isAdmin, from, to);
  }

  @Post()
  // Creates a new booking with basic location data
  @ApiCreatedResponse({ type: BookingResponseDto, description: 'Reserva creada' })
  @ApiQuery({ name: 'startTime', type: String, required: true })
  @ApiQuery({ name: 'endTime', type: String, required: true })
  @ApiQuery({ name: 'country', type: String, required: true })
  @ApiQuery({ name: 'city', type: String, required: true })
  @ApiQuery({ name: 'department', type: String, required: true })
  @ApiQuery({ name: 'house', type: String, required: true })
  create(
    @Req() req: any,
    @Query('startTime') startTime: string,
    @Query('endTime') endTime: string,
    @Query('country') country: string,
    @Query('city') city: string,
    @Query('department') department: string,
    @Query('house') house: string,
  ) {
    const dto: CreateBookingDto = { startTime, endTime, country, city, department, house };
    return this.bookingsService.create(req.user.userId, dto);
  }

  @Delete(':id')
  // Marks an existing booking as cancelled
  cancel(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    const isAdmin = req.user.role === 'ADMIN';
    return this.bookingsService.cancel(id, req.user.userId, isAdmin);
  }

  @Patch(':id')
  // Updates main fields of an existing booking
  @ApiOkResponse({ type: BookingResponseDto, description: 'Reserva actualizada' })
  update(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateBookingDto,
  ) {
    const isAdmin = req.user.role === 'ADMIN';
    return this.bookingsService.update(id, req.user.userId, isAdmin, dto);
  }
}
