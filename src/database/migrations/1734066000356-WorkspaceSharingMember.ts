import { MigrationInterface, QueryRunner } from 'typeorm';

export class WorkspaceSharingMember1734066000356 implements MigrationInterface {
  name = 'WorkspaceSharingMember1734066000356';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "public"."workspaces_sharing_members_roleaccess_enum" AS ENUM ('MANAGE', 'CREATE', 'READ', 'UPDATE', 'DELETE');
    `);
    await queryRunner.query(
      `CREATE TABLE "workspaces_sharing_members" (
        "workspaceId" uuid NOT NULL, 
        "memberId" uuid NOT NULL, 
        "roleAccess" "public"."workspaces_sharing_members_roleaccess_enum" NOT NULL DEFAULT 'READ', 
        CONSTRAINT "PK_526adfe15ab854881ae1faee066" PRIMARY KEY ("workspaceId", "memberId")
      )`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_526adfe15ab854881ae1faee06" 
      ON "workspaces_sharing_members" ("workspaceId", "memberId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "workspaces_sharing_members" 
      ADD CONSTRAINT "FK_bd91377c015a6820073e16caf53" 
      FOREIGN KEY ("workspaceId") 
      REFERENCES "workspace"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "workspaces_sharing_members" 
      ADD CONSTRAINT "FK_649493c94e5b2957a85c90e1a92" 
      FOREIGN KEY ("memberId") 
      REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "workspaces_sharing_members" 
      DROP CONSTRAINT "FK_649493c94e5b2957a85c90e1a92"`,
    );
    await queryRunner.query(
      `ALTER TABLE "workspaces_sharing_members" 
      DROP CONSTRAINT "FK_bd91377c015a6820073e16caf53"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_526adfe15ab854881ae1faee06"`,
    );
    await queryRunner.query(`
      DROP TYPE "public"."workspaces_sharing_members_roleaccess_enum";
    `);
    await queryRunner.query(`DROP TABLE "workspaces_sharing_members"`);
  }
}
