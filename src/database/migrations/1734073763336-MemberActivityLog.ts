import { MigrationInterface, QueryRunner } from 'typeorm';

export class MemberActivityLog1734073763336 implements MigrationInterface {
  name = 'MemberActivityLog1734073763336';
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "public"."member_activity_log_entitytype_enum" AS ENUM ('WORKSPACE', 'ACCOUNT');
    `);
    await queryRunner.query(`
      CREATE TYPE "public"."member_activity_log_action_enum" AS ENUM ('MANAGE', 'CREATE', 'READ', 'UPDATE', 'DELETE');
    `);
    await queryRunner.query(
      `CREATE TABLE "member_activity_log" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(), 
        "entityType" "public"."member_activity_log_entitytype_enum" NOT NULL, 
        "action" "public"."member_activity_log_action_enum" NOT NULL, 
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), 
        "accountId" uuid, "workspaceId" uuid, 
        CONSTRAINT "PK_74021a6e9f66391900278fda344" 
        PRIMARY KEY ("id")
      )`,
    );
    await queryRunner.query(
      `ALTER TABLE "member_activity_log" 
      ADD CONSTRAINT "FK_34a07a0af7ee0412bb530a76cd9" FOREIGN KEY ("accountId") 
      REFERENCES "account"("id") 
      ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "member_activity_log" 
      ADD CONSTRAINT "FK_923b45c5760363b2ca8b12e855f" FOREIGN KEY ("workspaceId") 
      REFERENCES "workspace"("id") 
      ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "member_activity_log" 
      DROP CONSTRAINT "FK_923b45c5760363b2ca8b12e855f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "member_activity_log" 
      DROP CONSTRAINT "FK_34a07a0af7ee0412bb530a76cd9"`,
    );
    await queryRunner.query(`
      DROP TYPE "public"."member_activity_log_entitytype_enum";
    `);
    await queryRunner.query(`
      DROP TYPE "public"."member_activity_log_action_enum";
    `);
    await queryRunner.query(`DROP TABLE "member_activity_log"`);
  }
}
