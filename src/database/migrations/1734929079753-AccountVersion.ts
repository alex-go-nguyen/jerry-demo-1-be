import { MigrationInterface, QueryRunner } from 'typeorm';

export class AccountVersion1734929079753 implements MigrationInterface {
  name = 'AccountVersion1734929079753';
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "account_version" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "domain" character varying NOT NULL, "username" character varying NOT NULL, "password" character varying NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "accountId" uuid, "actorId" uuid, CONSTRAINT "PK_965c40deda5ffa7bd9c5c58ac84" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "account_version" ADD CONSTRAINT "FK_59f1a50a6d683741d1c8eae13d4" FOREIGN KEY ("accountId") REFERENCES "account"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "account_version" ADD CONSTRAINT "FK_2655f3c39960220565076565ec1" FOREIGN KEY ("actorId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "account_version" DROP CONSTRAINT "FK_2655f3c39960220565076565ec1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "account_version" DROP CONSTRAINT "FK_59f1a50a6d683741d1c8eae13d4"`,
    );
    await queryRunner.query(`DROP TABLE "account_version"`);
  }
}
