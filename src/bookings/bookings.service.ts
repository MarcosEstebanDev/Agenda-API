import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../utils/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';

@Injectable()
export class BookingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

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

  async getAlertsForUser(userId: number, withinMinutes = 60) {
    const now = new Date();
    const until = new Date(now.getTime() + withinMinutes * 60 * 1000);

    const [ongoing, upcoming] = await Promise.all([
      (this.prisma as any).booking.findMany({
        where: {
          userId,
          cancelled: false,
          startTime: { lte: now },
          endTime: { gte: now },
        },
        orderBy: { startTime: 'asc' },
      }),
      (this.prisma as any).booking.findMany({
        where: {
          userId,
          cancelled: false,
          startTime: { gt: now, lte: until },
        },
        orderBy: { startTime: 'asc' },
      }),
    ]);

    return { ongoing, upcoming };
  }

  async getAlertsForAll(isAdmin: boolean, withinMinutes = 60) {
    if (!isAdmin) {
      throw new ForbiddenException('Solo los administradores pueden ver alertas globales');
    }

    const now = new Date();
    const until = new Date(now.getTime() + withinMinutes * 60 * 1000);

    const [ongoing, upcoming] = await Promise.all([
      (this.prisma as any).booking.findMany({
        where: {
          cancelled: false,
          startTime: { lte: now },
          endTime: { gte: now },
        },
        orderBy: { startTime: 'asc' },
      }),
      (this.prisma as any).booking.findMany({
        where: {
          cancelled: false,
          startTime: { gt: now, lte: until },
        },
        orderBy: { startTime: 'asc' },
      }),
    ]);

    return { ongoing, upcoming };
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

    const booking = await (this.prisma as any).booking.create({
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

    await this.notificationsService.createForBooking({
      userId,
      bookingId: booking.id,
      type: 'BOOKING_CREATED',
      title: 'Reserva creada',
      body: `Tu reserva del ${start.toISOString()} al ${end.toISOString()} ha sido creada`,
      scheduledFor: start,
    });

    return booking;
  }

  async cancel(id: number, userId: number, isAdmin: boolean) {
    const booking = await (this.prisma as any).booking.findUnique({ where: { id } });
    if (!booking) {
      throw new NotFoundException('Reserva no encontrada');
    }

    if (!isAdmin && booking.userId !== userId) {
      throw new ForbiddenException('No puedes cancelar esta reserva');
    }

    const updated = await (this.prisma as any).booking.update({
      where: { id },
      data: { cancelled: true },
    });

    await this.notificationsService.createForBooking({
      userId: booking.userId,
      bookingId: booking.id,
      type: 'BOOKING_CANCELLED',
      title: 'Reserva cancelada',
      body: 'Una de tus reservas ha sido cancelada',
    });

    return updated;
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

    const updated = await (this.prisma as any).booking.update({
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

    await this.notificationsService.createForBooking({
      userId: booking.userId,
      bookingId: booking.id,
      type: 'BOOKING_UPDATED',
      title: 'Reserva actualizada',
      body: `Tu reserva ha sido actualizada. Nuevo horario: ${start.toISOString()} - ${end.toISOString()}`,
    });

    return updated;
  }
}
