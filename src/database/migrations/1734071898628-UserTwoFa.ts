import { MigrationInterface, QueryRunner } from 'typeorm';

export class UserTwoFa1734071898628 implements MigrationInterface {
  name = 'UserTwoFa1734071898628';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "public"."user_two_fa_status_enum" AS ENUM ('DISABLED', 'ENABLED', 'NOT_REGISTERED');
    `);
    await queryRunner.query(
      `CREATE TABLE "user_two_fa" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(), 
        "secret" character varying NOT NULL, 
        "status" "public"."user_two_fa_status_enum" NOT NULL DEFAULT 'NOT_REGISTERED', 
        "userId" uuid, CONSTRAINT "REL_c4d1b4cf0ceed00a4c1c799ad8" UNIQUE ("userId"), 
        CONSTRAINT "PK_318ef93e5b1a1f1594fc333c965" PRIMARY KEY ("id")
      )`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_two_fa" 
      ADD CONSTRAINT "FK_c4d1b4cf0ceed00a4c1c799ad8b" 
      FOREIGN KEY ("userId") REFERENCES "user"("id") 
      ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_two_fa" 
      DROP CONSTRAINT "FK_c4d1b4cf0ceed00a4c1c799ad8b"`,
    );
    await queryRunner.query(`
      DROP TYPE "public"."user_two_fa_status_enum";
    `);
    await queryRunner.query(`DROP TABLE "user_two_fa"`);
  }
}
