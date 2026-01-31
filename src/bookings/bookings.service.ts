import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../utils/prisma.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';

@Injectable()
export class BookingsService {
  constructor(private readonly prisma: PrismaService) {}

  async findForUser(userId: number, from?: Date, to?: Date) {
    const where: any = { userId, cancelled: false };

    if (from || to) {
      where.startTime = {};
      if (from) {
        where.startTime.gte = from;
      }
      if (to) {
        where.startTime.lte = to;
      }
    }

    return (this.prisma as any).booking.findMany({
      where,
      orderBy: { startTime: 'asc' },
    });
  }

  async findAll(isAdmin: boolean, from?: Date, to?: Date) {
    if (!isAdmin) {
      throw new ForbiddenException('Solo los administradores pueden ver todas las reservas');
    }

    const where: any = { cancelled: false };

    if (from || to) {
      where.startTime = {};
      if (from) {
        where.startTime.gte = from;
      }
      if (to) {
        where.startTime.lte = to;
      }
    }

    return (this.prisma as any).booking.findMany({
      where,
      orderBy: { startTime: 'asc' },
    });
  }

  async create(userId: number, dto: CreateBookingDto) {
    const start = new Date(dto.startTime);
    const end = new Date(dto.endTime);

    if (end <= start) {
      throw new ForbiddenException('La hora de fin debe ser posterior a la de inicio');
    }

    const overlapping = await (this.prisma as any).booking.findFirst({
      where: {
        userId,
        cancelled: false,
        startTime: { lt: end },
        endTime: { gt: start },
      },
    });

    if (overlapping) {
      throw new ForbiddenException('Ya existe una reserva en ese horario');
    }

    return (this.prisma as any).booking.create({
      data: {
        userId,
        startTime: start,
        endTime: end,
        country: dto.country,
        city: dto.city,
        department: dto.department,
        house: dto.house,
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

  async update(id: number, userId: number, isAdmin: boolean, dto: UpdateBookingDto) {
    const booking = await (this.prisma as any).booking.findUnique({ where: { id } });
    if (!booking) {
      throw new NotFoundException('Reserva no encontrada');
    }

    if (!isAdmin && booking.userId !== userId) {
      throw new ForbiddenException('No puedes actualizar esta reserva');
    }

    let start = booking.startTime as Date;
    let end = booking.endTime as Date;

    if (dto.startTime) {
      start = new Date(dto.startTime);
    }
    if (dto.endTime) {
      end = new Date(dto.endTime);
    }

    if (end <= start) {
      throw new ForbiddenException('La hora de fin debe ser posterior a la de inicio');
    }

    const overlapping = await (this.prisma as any).booking.findFirst({
      where: {
        id: { not: id },
        userId: booking.userId,
        cancelled: false,
        startTime: { lt: end },
        endTime: { gt: start },
      },
    });

    if (overlapping) {
      throw new ForbiddenException('Ya existe una reserva en ese horario');
    }

    return (this.prisma as any).booking.update({
      where: { id },
      data: {
        startTime: start,
        endTime: end,
        country: dto.country ?? booking.country,
        city: dto.city ?? booking.city,
        department: dto.department ?? booking.department,
        house: dto.house ?? booking.house,
      },
    });
  }
}
