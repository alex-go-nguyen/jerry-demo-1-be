import { MigrationInterface, QueryRunner } from 'typeorm';

export class WorkspaceUser1728981481146 implements MigrationInterface {
  name = 'WorkspaceUser1728981481146';
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "workspace_users" (
            "workspaceId" uuid NOT NULL,
            "userId" uuid NOT NULL,
            CONSTRAINT "PK_fe4f6e13489c4ad1a946910f529" PRIMARY KEY ("workspaceId", "userId")
          )`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_9b226f3cec0ffab646d5607a0c" ON "workspace_users" ("workspaceId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_70db33ab07e28bfa1fc6011d4e" ON "workspace_users" ("userId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "workspace_users" ADD CONSTRAINT "FK_9b226f3cec0ffab646d5607a0c5" FOREIGN KEY ("workspaceId") REFERENCES "workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "workspace_users" ADD CONSTRAINT "FK_70db33ab07e28bfa1fc6011d4ee" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "workspace_users" DROP CONSTRAINT "FK_70db33ab07e28bfa1fc6011d4ee"`,
    );
    await queryRunner.query(
      `ALTER TABLE "workspace_users" DROP CONSTRAINT "FK_9b226f3cec0ffab646d5607a0c5"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_70db33ab07e28bfa1fc6011d4e"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_9b226f3cec0ffab646d5607a0c"`,
    );
    await queryRunner.query(`DROP TABLE "workspace_users"`);
  }
}
