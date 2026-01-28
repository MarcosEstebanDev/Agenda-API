import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../utils/prisma.service';
import { CreateBookingDto } from './dto/create-booking.dto';

@Injectable()
export class BookingsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: number, dto: CreateBookingDto) {
    const start = new Date(dto.startTime);
    const end = new Date(dto.endTime);

    if (end <= start) {
      throw new ForbiddenException('La hora de fin debe ser posterior a la de inicio');
    }

    return (this.prisma as any).booking.create({
      data: {
        userId,
        startTime: start,
        endTime: end,
      },
    });
  }

  async cancel(id: number, userId: number, isAdmin: boolean) {
    const booking = await (this.prisma as any).booking.findUnique({ where: { id } });
    if (!booking) {
      throw new NotFoundException('Reserva no encontrada');
    }

    if (!isAdmin && booking.userId !== userId) {
      throw new ForbiddenException('No puedes cancelar esta reserva');
    }

    return (this.prisma as any).booking.update({
      where: { id },
      data: { cancelled: true },
    });
  }
}
