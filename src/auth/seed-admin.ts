import 'dotenv/config';
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { Role } from './entities/roles.entity';

const ds = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  entities: [User, Role],
});

async function main() {
  await ds.initialize();
  const roleRepo = ds.getRepository(Role);
  const userRepo = ds.getRepository(User);

  // Asegura roles (el SQL ya los inserta, pero esto es idempotente)
  for (const name of ['ADMIN', 'EDITOR']) {
    const found = await roleRepo.findOne({ where: { name } });
    if (!found) await roleRepo.save(roleRepo.create({ name }));
  }

  const email = process.env.ADMIN_EMAIL || 'admin@mudecoop.cr';
  let admin = await userRepo.findOne({ where: { email } });

  if (!admin) {
    const adminRole = await roleRepo.findOneByOrFail({ name: 'ADMIN' });
    const plain = process.env.ADMIN_PASSWORD || 'Admin#2025';
    const hash = await bcrypt.hash(plain, 10);

    admin = userRepo.create({
      firstName: 'Administrator',
      lastName: 'MUDECOOP',
      secondLastName: null,
      email,
      password: hash,
      status: 'active',
      role: adminRole,
    });

    await userRepo.save(admin);
    console.log('Admin created:', email, 'password:', plain);
  } else {
    console.log('Admin already exists:', email);
  }

  await ds.destroy();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
