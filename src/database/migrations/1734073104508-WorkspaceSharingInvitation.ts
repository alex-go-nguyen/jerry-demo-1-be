import { MigrationInterface, QueryRunner } from 'typeorm';

export class WorkspaceSharingInvitation1734073104508
  implements MigrationInterface
{
  name = 'WorkspaceSharingInvitation1734073104508';
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "public"."workspaces_sharing_invitations_status_enum" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINE','EXPIRED');
    `);
    await queryRunner.query(`
      CREATE TYPE "public"."workspaces_sharing_invitations_roleaccess_enum" AS ENUM ('MANAGE', 'CREATE', 'READ', 'UPDATE', 'DELETE');
    `);
    await queryRunner.query(
      `CREATE TABLE "workspaces_sharing_invitations" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(), 
        "email" character varying NOT NULL, 
        "status" "public"."workspaces_sharing_invitations_status_enum" NOT NULL DEFAULT 'PENDING', 
        "roleAccess" "public"."workspaces_sharing_invitations_roleaccess_enum" NOT NULL DEFAULT 'READ', 
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(), 
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), 
        "ownerId" uuid, "workspaceId" uuid, 
        CONSTRAINT "PK_903c5a1a8adb4700965df6e5a86" PRIMARY KEY ("id")
      )`,
    );
    await queryRunner.query(
      `ALTER TABLE "workspaces_sharing_invitations" 
      ADD CONSTRAINT "FK_cf0c21f6e5127eda4c637f7406a" 
      FOREIGN KEY ("ownerId") REFERENCES "user"("id") 
      ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "workspaces_sharing_invitations" 
      ADD CONSTRAINT "FK_8a837b39a69cee6b5601f5361c9" 
      FOREIGN KEY ("workspaceId") REFERENCES "workspace"("id") 
      ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "workspaces_sharing_invitations" 
      DROP CONSTRAINT "FK_8a837b39a69cee6b5601f5361c9"`,
    );
    await queryRunner.query(
      `ALTER TABLE "workspaces_sharing_invitations" 
      DROP CONSTRAINT "FK_cf0c21f6e5127eda4c637f7406a"`,
    );
    await queryRunner.query(`
      DROP TYPE "public"."workspaces_sharing_invitations_status_enum";
    `);
    await queryRunner.query(`
      DROP TYPE "public"."workspaces_sharing_invitations_roleaccess_enum";
    `);
    await queryRunner.query(`DROP TABLE "workspaces_sharing_invitations"`);
  }
}
