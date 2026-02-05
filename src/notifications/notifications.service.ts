import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../utils/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async findForUser(userId: number, onlyUnread?: boolean) {
    const where: any = { userId };
    if (onlyUnread) {
      where.read = false;
    }
    return (this.prisma as any).notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAll(isAdmin: boolean, onlyUnread?: boolean) {
    if (!isAdmin) {
      throw new ForbiddenException('Solo los administradores pueden ver todas las notificaciones');
    }
    const where: any = {};
    if (onlyUnread) {
      where.read = false;
    }
    return (this.prisma as any).notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async markAsRead(id: number, userId: number, isAdmin: boolean) {
    const notification = await (this.prisma as any).notification.findUnique({ where: { id } });
    if (!notification) {
      throw new NotFoundException('Notificación no encontrada');
    }
    if (!isAdmin && notification.userId !== userId) {
      throw new ForbiddenException('No puedes modificar esta notificación');
    }
    return (this.prisma as any).notification.update({
      where: { id },
      data: { read: true, readAt: new Date() },
    });
  }

  async markAllAsRead(userId: number) {
    return (this.prisma as any).notification.updateMany({
      where: { userId, read: false },
      data: { read: true, readAt: new Date() },
    });
  }

  async createForBooking(params: {
    userId: number;
    bookingId?: number;
    type: string;
    title: string;
    body: string;
    scheduledFor?: Date;
  }) {
    return (this.prisma as any).notification.create({
      data: {
        userId: params.userId,
        bookingId: params.bookingId,
        type: params.type,
        title: params.title,
        body: params.body,
        scheduledFor: params.scheduledFor,
      },
    });
  }
}
