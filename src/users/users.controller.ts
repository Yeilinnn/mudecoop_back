import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Usuarios (ADMIN)')
@ApiBearerAuth('bearer')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('ADMIN')
@Controller()
export class UsersController {
  constructor(private readonly users: UsersService) {}

  // Roles
  @Get('roles')
  @ApiOperation({ summary: 'Listar roles disponibles' })
  listRoles() {
    return this.users.listRoles();
  }

  // Usuarios
  @Get('users')
  @ApiOperation({ summary: 'Listar usuarios' })
  findAll() {
    return this.users.findAll();
  }

  @Post('users')
  @ApiOperation({ summary: 'Crear usuario' })
  @ApiBody({
    schema: {
      example: {
        firstName: 'María',
        lastName: 'Rodríguez',
        secondLastName: 'López',
        email: 'maria@mudecoop.cr',
        password: 'Segura#2025',
        roleId: 2,        // 1=ADMIN, 2=EDITOR (ejemplo)
        status: 'active', // active | inactive
      },
    },
  })
  create(@Body() dto: CreateUserDto) {
    return this.users.create(dto);
  }

  @Patch('users/:id')
  @ApiOperation({ summary: 'Editar datos del usuario' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateUserDto) {
    return this.users.update(id, dto);
  }

  @Patch('users/:id/role')
  @ApiOperation({ summary: 'Cambiar rol del usuario' })
  @ApiBody({ schema: { example: { roleId: 1 } } })
  updateRole(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateRoleDto) {
    return this.users.updateRole(id, dto.roleId);
  }

  @Patch('users/:id/status')
  @ApiOperation({ summary: 'Cambiar estado del usuario (activar/inactivar)' })
  @ApiBody({ schema: { example: { status: 'inactive' } } })
  updateStatus(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateStatusDto) {
    return this.users.updateStatus(id, dto.status);
  }

  @Patch('users/:id/password')
  @ApiOperation({ summary: 'Resetear contraseña del usuario' })
  @ApiBody({ schema: { example: { password: 'NuevaClave#2025' } } })
  updatePassword(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdatePasswordDto) {
    return this.users.updatePassword(id, dto.password);
  }
}
