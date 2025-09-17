import { MigrationInterface, QueryRunner } from "typeorm";

export class InitSchema1758140137368 implements MigrationInterface {
    name = 'InitSchema1758140137368'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`users\` DROP FOREIGN KEY \`fk_users_role\``);
        await queryRunner.query(`ALTER TABLE \`tokens\` DROP FOREIGN KEY \`fk_tokens_user\``);
        await queryRunner.query(`ALTER TABLE \`dish\` DROP FOREIGN KEY \`fk_dish_category\``);
        await queryRunner.query(`DROP INDEX \`email\` ON \`users\``);
        await queryRunner.query(`DROP INDEX \`ix_dish_active\` ON \`dish\``);
        await queryRunner.query(`DROP INDEX \`ix_dish_category\` ON \`dish\``);
        await queryRunner.query(`DROP INDEX \`name\` ON \`menu_category\``);
        await queryRunner.query(`ALTER TABLE \`users\` CHANGE \`email\` \`email\` varchar(150) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`users\` ADD UNIQUE INDEX \`IDX_97672ac88f789774dd47f7c8be\` (\`email\`)`);
        await queryRunner.query(`ALTER TABLE \`users\` CHANGE \`role_id\` \`role_id\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`dish\` CHANGE \`is_active\` \`is_active\` tinyint NOT NULL DEFAULT 1`);
        await queryRunner.query(`ALTER TABLE \`menu_category\` CHANGE \`name\` \`name\` varchar(100) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`menu_category\` ADD UNIQUE INDEX \`IDX_5a2d8aba371281e6eee1826ab6\` (\`name\`)`);
        await queryRunner.query(`ALTER TABLE \`users\` ADD CONSTRAINT \`FK_a2cecd1a3531c0b041e29ba46e1\` FOREIGN KEY (\`role_id\`) REFERENCES \`roles\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`users\` DROP FOREIGN KEY \`FK_a2cecd1a3531c0b041e29ba46e1\``);
        await queryRunner.query(`ALTER TABLE \`menu_category\` DROP INDEX \`IDX_5a2d8aba371281e6eee1826ab6\``);
        await queryRunner.query(`ALTER TABLE \`menu_category\` CHANGE \`name\` \`name\` varchar(100) COLLATE "utf8mb4_0900_ai_ci" NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`dish\` CHANGE \`is_active\` \`is_active\` tinyint(1) NOT NULL DEFAULT '1'`);
        await queryRunner.query(`ALTER TABLE \`users\` CHANGE \`role_id\` \`role_id\` int NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`users\` DROP INDEX \`IDX_97672ac88f789774dd47f7c8be\``);
        await queryRunner.query(`ALTER TABLE \`users\` CHANGE \`email\` \`email\` varchar(150) COLLATE "utf8mb4_0900_ai_ci" NOT NULL`);
        await queryRunner.query(`CREATE UNIQUE INDEX \`name\` ON \`menu_category\` (\`name\`)`);
        await queryRunner.query(`CREATE INDEX \`ix_dish_category\` ON \`dish\` (\`category_id\`)`);
        await queryRunner.query(`CREATE INDEX \`ix_dish_active\` ON \`dish\` (\`is_active\`)`);
        await queryRunner.query(`CREATE UNIQUE INDEX \`email\` ON \`users\` (\`email\`)`);
        await queryRunner.query(`ALTER TABLE \`dish\` ADD CONSTRAINT \`fk_dish_category\` FOREIGN KEY (\`category_id\`) REFERENCES \`menu_category\`(\`id\`) ON DELETE RESTRICT ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE \`tokens\` ADD CONSTRAINT \`fk_tokens_user\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE \`users\` ADD CONSTRAINT \`fk_users_role\` FOREIGN KEY (\`role_id\`) REFERENCES \`roles\`(\`id\`) ON DELETE RESTRICT ON UPDATE CASCADE`);
    }

}
