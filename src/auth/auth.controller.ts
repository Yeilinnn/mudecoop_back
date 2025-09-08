// src/auth/auth.controller.ts
import { Body, Controller, Get, Post, UseGuards, Req, HttpCode } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';

@ApiTags('Autenticación')
@ApiBearerAuth('bearer') // Debe coincidir con main.ts
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  // ===============================
  // LOGIN
  // ===============================
  @Post('login')
  @HttpCode(200)
  @ApiOperation({ summary: 'Iniciar sesión de usuario' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Inicio de sesión exitoso',
    schema: {
      example: {
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        user: {
          id: 1,
          firstName: 'Juan',
          lastName: 'Pérez',
          secondLastName: null,
          email: 'juan.perez@tudominio.com',
          status: 'active',
          createdAt: '2025-09-03T06:47:23.000Z',
          updatedAt: '2025-09-03T06:47:23.000Z',
          role: { id: 2, name: 'EDITOR' },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 401, description: 'Correo o contraseña incorrectos / Usuario inactivo' })
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  // ===============================
  // ME - PROBAR TOKEN
  // ===============================
  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  @ApiOperation({ summary: 'Obtener información del usuario autenticado' })
  @ApiResponse({
    status: 200,
    description: 'Usuario autenticado',
    schema: {
      example: {
        id: 3,
        firstName: 'Juan',
        lastName: 'Pérez',
        secondLastName: null,
        email: 'juan.perez@tudominio.com',
        status: 'active',
        createdAt: '2025-09-03T06:47:23.000Z',
        updatedAt: '2025-09-03T06:47:23.000Z',
        role: { id: 2, name: 'EDITOR' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Token inválido o expirado' })
  me(@Req() req: any) {
    return req.user;
  }

  // ===============================
  // REFRESH TOKEN (seguir conectado)
  // ===============================
  @Post('refresh')
  @HttpCode(200)
  @ApiOperation({ summary: 'Renovar sesión (obtener nuevo accessToken)' })
  @ApiBody({ type: RefreshDto })
  @ApiResponse({
    status: 200,
    description: 'Access token renovado',
    schema: { example: { accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' } },
  })
  @ApiResponse({ status: 401, description: 'Sesión revocada / inválida / expirada' })
  refresh(@Body() dto: RefreshDto) {
    return this.auth.refresh(dto.refreshToken);
  }

  // ===============================
  // LOGOUT (revocar refresh)
  // ===============================
  @Post('logout')
  @HttpCode(200)
  @ApiOperation({ summary: 'Cerrar sesión e invalidar el refresh token' })
  @ApiBody({ type: RefreshDto })
  @ApiResponse({
    status: 200,
    description: 'Sesión cerrada',
    schema: { example: { message: 'Sesión cerrada.' } },
  })
  logout(@Body() dto: RefreshDto) {
    return this.auth.logout(dto.refreshToken);
  }
}
