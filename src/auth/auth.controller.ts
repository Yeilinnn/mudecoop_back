import { Body, Controller, Get, Post, UseGuards, Req, HttpCode, Query } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody, ApiQuery } from '@nestjs/swagger';

@ApiTags('Autenticación')
@ApiBearerAuth('bearer')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('login')
  @HttpCode(200)
  @ApiOperation({ summary: 'Iniciar sesión de usuario' })
  @ApiBody({ schema: { example: { email: 'admin@mudecoop.cr', password: 'Admin#2025' } } })
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  @ApiOperation({ summary: 'Obtener información del usuario autenticado' })
  me(@Req() req: any) {
    return req.user;
  }

  @Post('refresh')
  @HttpCode(200)
  @ApiOperation({ summary: 'Renovar sesión (nuevo accessToken)' })
  @ApiBody({ schema: { example: { refreshToken: '<tu_refresh_jwt>' } } })
  refresh(@Body() dto: RefreshDto) {
    return this.auth.refresh(dto.refreshToken);
  }

  @Post('logout')
  @HttpCode(200)
  @ApiOperation({ summary: 'Cerrar sesión e invalidar el refresh token' })
  @ApiBody({ schema: { example: { refreshToken: '<tu_refresh_jwt>' } } })
  logout(@Body() dto: RefreshDto) {
    return this.auth.logout(dto.refreshToken);
  }

  @Post('forgot-password')
  @HttpCode(200)
  @ApiOperation({ summary: 'Solicitar enlace de restablecimiento de contraseña' })
  @ApiBody({ schema: { example: { email: 'admin@mudecoop.cr' } } })
  forgot(@Body() dto: ForgotPasswordDto) {
    return this.auth.requestPasswordReset(dto);
  }

  @Post('reset-password')
  @HttpCode(200)
  @ApiOperation({ summary: 'Restablecer contraseña con token' })
  @ApiBody({ schema: { example: { token: '<token_por_correo>', password: 'NuevoPass#2025' } } })
  reset(@Body() dto: ResetPasswordDto) {
    return this.auth.resetPassword(dto);
  }

  @Get('verify-reset-token')
  @HttpCode(200)
  @ApiOperation({ summary: 'Comprobar si un token de reseteo es válido' })
  @ApiQuery({ name: 'token', required: true, example: '<token_por_correo>' })
  verifyResetToken(@Query('token') token: string) {
    return this.auth.verifyResetToken(token);
  }
}
