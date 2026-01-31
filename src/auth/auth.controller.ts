import { Controller, Post, Query } from '@nestjs/common';
import { ApiOkResponse, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOkResponse({ description: 'Login OK' })
  @ApiQuery({ name: 'email', type: String, required: true })
  @ApiQuery({ name: 'password', type: String, required: true })
  login(@Query('email') email: string, @Query('password') password: string) {
    const dto: LoginDto = { email, password };
    return this.authService.login(dto.email, dto.password);
  }
}
