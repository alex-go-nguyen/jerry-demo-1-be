import { MigrationInterface, QueryRunner } from 'typeorm';

export class AccountSharingMember1734072752245 implements MigrationInterface {
  name = 'AccountSharingMember1734072752245';
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "public"."accounts_sharing_members_roleaccess_enum" AS ENUM ('MANAGE', 'CREATE', 'READ', 'UPDATE', 'DELETE');
    `);
    await queryRunner.query(
      `CREATE TABLE "accounts_sharing_members" (
        "accountId" uuid NOT NULL, "memberId" uuid NOT NULL, 
        "roleAccess" "public"."accounts_sharing_members_roleaccess_enum" NOT NULL DEFAULT 'READ',
        CONSTRAINT "PK_ca0d70749fcf207276314e8acc4" PRIMARY KEY ("accountId", "memberId")
      )`,
    );
    await queryRunner.query(
      `ALTER TABLE "accounts_sharing_members" 
        ADD CONSTRAINT "FK_6473f9491d4a33103dffddb3e04" 
        FOREIGN KEY ("accountId") REFERENCES "account"("id") 
        ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `ALTER TABLE "accounts_sharing_members" 
        ADD CONSTRAINT "FK_9b8bba9bd74ebf044f1db1bd8b4" 
        FOREIGN KEY ("memberId") REFERENCES "user"("id") 
        ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_ca0d70749fcf207276314e8acc" ON "accounts_sharing_members" ("accountId", "memberId") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "accounts_sharing_members" 
      DROP CONSTRAINT "FK_9b8bba9bd74ebf044f1db1bd8b4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "accounts_sharing_members" 
      DROP CONSTRAINT "FK_6473f9491d4a33103dffddb3e04"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ca0d70749fcf207276314e8acc"`,
    );
    await queryRunner.query(`
      DROP TYPE "public"."accounts_sharing_members_roleaccess_enum";
    `);
    await queryRunner.query(`DROP TABLE "accounts_sharing_members"`);
  }
}
