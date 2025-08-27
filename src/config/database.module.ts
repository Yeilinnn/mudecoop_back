import 'dotenv/config';
import { DynamicModule, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeOrmConfig } from './typeorm.config';

@Module({})
export class DatabaseModule {
  static forRoot(): DynamicModule {
    const enabled = process.env.ENABLE_DB === 'true';
    return {
      module: DatabaseModule,
      imports: enabled
        ? [TypeOrmModule.forRootAsync({ useFactory: typeOrmConfig })]
        : [],
    };
  }
}
