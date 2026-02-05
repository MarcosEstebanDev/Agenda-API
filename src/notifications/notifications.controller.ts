import { Controller, Get, Patch, Param, ParseIntPipe, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiQuery, ApiTags } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('me')
  @ApiOkResponse({ description: 'Notificaciones del usuario autenticado' })
  @ApiQuery({ name: 'onlyUnread', type: Boolean, required: false })
  getMyNotifications(
    @Req() req: any,
    @Query('onlyUnread') onlyUnread?: boolean,
  ) {
    return this.notificationsService.findForUser(req.user.userId, onlyUnread);
  }

  @Get()
  @ApiOkResponse({ description: 'Todas las notificaciones (solo admin)' })
  @ApiQuery({ name: 'onlyUnread', type: Boolean, required: false })
  getAllNotifications(
    @Req() req: any,
    @Query('onlyUnread') onlyUnread?: boolean,
  ) {
    const isAdmin = req.user.role === 'ADMIN';
    return this.notificationsService.findAll(isAdmin, onlyUnread);
  }

  @Patch(':id/read')
  @ApiOkResponse({ description: 'Marca una notificación como leída' })
  markAsRead(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const isAdmin = req.user.role === 'ADMIN';
    return this.notificationsService.markAsRead(id, req.user.userId, isAdmin);
  }

  @Patch('read-all')
  @ApiOkResponse({ description: 'Marca todas las notificaciones del usuario como leídas' })
  markAllAsRead(@Req() req: any) {
    return this.notificationsService.markAllAsRead(req.user.userId);
  }
}
