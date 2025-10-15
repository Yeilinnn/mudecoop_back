import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from 'src/auth/entities/user.entity';
import { Role } from 'src/auth/entities/roles.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateRoleDto } from './dto/create-role.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private users: Repository<User>,
    @InjectRepository(Role) private roles: Repository<Role>,
  ) {}

  private strip(user: User) {
    const { password, ...rest } = user as any;
    return rest;
  }

  // Helpers usados por AuthService
  async findByEmail(email: string) {
    return this.users.findOne({ where: { email } });
  }

  async findById(id: number) {
    return this.users.findOne({ where: { id } });
  }

  // ===== Roles =====
  async listRoles() {
    return this.roles.find({ select: ['id', 'name'] });
  }

  async createRole(dto: CreateRoleDto) {
    const name = dto.name.trim().toUpperCase();
    const exists = await this.roles.findOne({ where: { name } });
    if (exists) throw new BadRequestException('El rol ya existe.');
    const role = this.roles.create({ name });
    return this.roles.save(role);
  }

  // ===== Usuarios =====
  async findAll() {
    const list = await this.users.find({ relations: ['role'] });
    return list.map(this.strip);
  }

  async create(dto: CreateUserDto) {
    const exists = await this.users.findOne({ where: { email: dto.email } });
    if (exists) throw new BadRequestException('El correo ya está registrado.');

    const role = await this.roles.findOne({ where: { id: dto.roleId } });
    if (!role) throw new BadRequestException('Rol no encontrado.');

    const hashed = await bcrypt.hash(dto.password, 10);
    const user = this.users.create({
      firstName: dto.firstName,
      lastName: dto.lastName,
      secondLastName: dto.secondLastName ?? null,
      email: dto.email,
      password: hashed,
      status: dto.status ?? 'active',
      role,
    });
    const saved = await this.users.save(user);
    return this.strip(saved);
  }

  async update(id: number, dto: UpdateUserDto) {
    const user = await this.users.findOne({ where: { id }, relations: ['role'] });
    if (!user) throw new NotFoundException('Usuario no encontrado.');

    if (dto.email && dto.email !== user.email) {
      const emailTaken = await this.users.findOne({ where: { email: dto.email, id: Not(id) } });
      if (emailTaken) throw new BadRequestException('El correo ya está registrado por otro usuario.');
    }

    Object.assign(user, dto);
    const saved = await this.users.save(user);
    return this.strip(saved);
  }

  async updateRole(id: number, roleId: number) {
    const user = await this.users.findOne({ where: { id }, relations: ['role'] });
    if (!user) throw new NotFoundException('Usuario no encontrado.');

    const role = await this.roles.findOne({ where: { id: roleId } });
    if (!role) throw new BadRequestException('Rol no encontrado.');
    user.role = role;

    const saved = await this.users.save(user);
    return this.strip(saved);
  }

  async updateStatus(id: number, status: 'active' | 'inactive') {
    const user = await this.users.findOne({ where: { id }, relations: ['role'] });
    if (!user) throw new NotFoundException('Usuario no encontrado.');
    user.status = status;

    const saved = await this.users.save(user);
    return this.strip(saved);
  }

  async updatePassword(id: number, password: string) {
    const user = await this.users.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Usuario no encontrado.');
    user.password = await bcrypt.hash(password, 10);
    const saved = await this.users.save(user);
    return this.strip(saved as any);
  }
}
