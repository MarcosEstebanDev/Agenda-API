import { Injectable } from '@nestjs/common';
import { PrismaService } from '../utils/prisma.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async validateUser(email: string, password: string) {
    const user = await (this.prisma as any).user.findUnique({ where: { email } });
    if (!user) return null;

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return null;

    return user;
  }

  async createAdminIfNotExists() {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@agenda.local';
    const existing = await (this.prisma as any).user.findUnique({ where: { email: adminEmail } });
    if (existing) return existing;

    const password = process.env.ADMIN_PASSWORD || 'admin123';
    const hashed = await bcrypt.hash(password, 10);

    return (this.prisma as any).user.create({
      data: {
        email: adminEmail,
        password: hashed,
        name: 'Admin',
        role: 'ADMIN',
      },
    });
  }
}
