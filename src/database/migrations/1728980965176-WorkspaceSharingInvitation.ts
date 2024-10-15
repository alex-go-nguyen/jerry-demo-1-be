import { MigrationInterface, QueryRunner } from 'typeorm';

export class WorkspaceSharingInvitation1728980965176
  implements MigrationInterface
{
  name = 'WorkspaceSharingInvitation1728980965176';
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "workspace_sharing_invitation" (
            "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
            "email" character varying NOT NULL,
            "status" character varying NOT NULL DEFAULT 'PENDING',
            "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
            "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
            "ownerId" uuid,
            "workspaceId" uuid,
            CONSTRAINT "PK_ff212a74a3d10304568ce0c86b6" PRIMARY KEY ("id")
          )`,
    );
    await queryRunner.query(
      `ALTER TABLE "workspace_sharing_invitation" ADD CONSTRAINT "FK_38bbe3b92d635907d1121665114" FOREIGN KEY ("ownerId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "workspace_sharing_invitation" ADD CONSTRAINT "FK_e3042d069bffd0e66c94e6f5ef5" FOREIGN KEY ("workspaceId") REFERENCES "workspace"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "workspace_sharing_invitation" DROP CONSTRAINT "FK_e3042d069bffd0e66c94e6f5ef5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "workspace_sharing_invitation" DROP CONSTRAINT "FK_38bbe3b92d635907d1121665114"`,
    );
    await queryRunner.query(`DROP TABLE "workspace_sharing_invitation"`);
  }
}
