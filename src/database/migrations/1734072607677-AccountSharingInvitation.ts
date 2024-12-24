import { MigrationInterface, QueryRunner } from 'typeorm';

export class AccountSharingInvitation1734072607677
  implements MigrationInterface
{
  name = 'AccountSharingInvitation1734072607677';
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "public"."accounts_sharing_invitations_status_enum" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINE','EXPIRED');
    `);
    await queryRunner.query(`
      CREATE TYPE "public"."accounts_sharing_invitations_roleaccess_enum" AS ENUM ('MANAGE', 'CREATE', 'READ', 'UPDATE', 'DELETE');
    `);
    await queryRunner.query(
      `CREATE TABLE "accounts_sharing_invitations" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(), 
        "email" character varying NOT NULL, 
        "status" "public"."accounts_sharing_invitations_status_enum" NOT NULL DEFAULT 'PENDING', 
        "roleAccess" "public"."accounts_sharing_invitations_roleaccess_enum" NOT NULL DEFAULT 'READ', 
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(), 
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), 
        "ownerId" uuid, 
        "accountId" uuid, 
        CONSTRAINT "PK_8244493b4ef36d278a401fde08e" PRIMARY KEY ("id")
      )`,
    );

    await queryRunner.query(
      `ALTER TABLE "accounts_sharing_invitations" 
      ADD CONSTRAINT "FK_c4f9814b6db3ae7662b408b9657" 
      FOREIGN KEY ("ownerId") REFERENCES "user"("id") 
      ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `ALTER TABLE "accounts_sharing_invitations" 
      ADD CONSTRAINT "FK_0c4835ef68a04b9067092860beb" 
      FOREIGN KEY ("accountId") REFERENCES "account"("id") 
      ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "accounts_sharing_invitations" 
      DROP CONSTRAINT "FK_0c4835ef68a04b9067092860beb"`,
    );
    await queryRunner.query(
      `ALTER TABLE "accounts_sharing_invitations" 
      DROP CONSTRAINT "FK_c4f9814b6db3ae7662b408b9657"`,
    );
    await queryRunner.query(`
      DROP TYPE "public"."accounts_sharing_invitations_status_enum";
    `);
    await queryRunner.query(`
      DROP TYPE "public"."accounts_sharing_invitations_roleaccess_enum";
    `);
    await queryRunner.query(`DROP TABLE "accounts_sharing_invitations"`);
  }
}
