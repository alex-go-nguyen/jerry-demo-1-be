import { MigrationInterface, QueryRunner } from 'typeorm';

export class HighLevelPassword1734072442582 implements MigrationInterface {
  name = 'HighLevelPassword1734072442582';
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "public"."high_level_password_status_enum" AS ENUM ('DISABLED', 'ENABLED', 'NOT_REGISTERED');
    `);
    await queryRunner.query(`
      CREATE TYPE "public"."high_level_password_type_enum" AS ENUM ('TEXT_KEY', 'FINGERPRINT');
    `);
    await queryRunner.query(
      `CREATE TABLE "high_level_password" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(), 
        "password" character varying NOT NULL, 
        "status" "public"."high_level_password_status_enum" NOT NULL DEFAULT 'ENABLED', 
        "type" "public"."high_level_password_type_enum" NOT NULL DEFAULT 'TEXT_KEY', 
        "userId" uuid, 
        CONSTRAINT "PK_f6fd8369a53f3d88e8933e532e3" PRIMARY KEY ("id")
      )`,
    );

    await queryRunner.query(
      `ALTER TABLE "high_level_password" 
      ADD CONSTRAINT "FK_e7de726f2449ec9fcbfd0159fe1" 
      FOREIGN KEY ("userId") REFERENCES "user"("id") 
      ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "high_level_password" 
      DROP CONSTRAINT "FK_e7de726f2449ec9fcbfd0159fe1"`,
    );
    await queryRunner.query(`
      DROP TYPE "public"."high_level_password_status_enum";
    `);
    await queryRunner.query(`DROP TABLE "high_level_password"`);
  }
}
