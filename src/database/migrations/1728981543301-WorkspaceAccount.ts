import { MigrationInterface, QueryRunner } from 'typeorm';

export class WorkspaceAccount1728981543301 implements MigrationInterface {
  name = 'WorkspaceAccount1728981543301';
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "workspace_accounts" (
            "workspaceId" uuid NOT NULL,
            "accountId" uuid NOT NULL,
            CONSTRAINT "PK_49b07fa3d99d65fccd75853811b" PRIMARY KEY ("workspaceId", "accountId")
          )`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_aa54f5c5109b40afa1bc6787a8" ON "workspace_accounts" ("workspaceId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_97ad59afd16f878395ffa55456" ON "workspace_accounts" ("accountId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "workspace_accounts" ADD CONSTRAINT "FK_aa54f5c5109b40afa1bc6787a89" FOREIGN KEY ("workspaceId") REFERENCES "workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "workspace_accounts" ADD CONSTRAINT "FK_97ad59afd16f878395ffa554564" FOREIGN KEY ("accountId") REFERENCES "account"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "workspace_accounts" DROP CONSTRAINT "FK_97ad59afd16f878395ffa554564"`,
    );
    await queryRunner.query(
      `ALTER TABLE "workspace_accounts" DROP CONSTRAINT "FK_aa54f5c5109b40afa1bc6787a89"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_97ad59afd16f878395ffa55456"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_aa54f5c5109b40afa1bc6787a8"`,
    );
    await queryRunner.query(`DROP TABLE "workspace_accounts"`);
  }
}
