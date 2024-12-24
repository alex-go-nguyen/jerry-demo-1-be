import { MigrationInterface, QueryRunner } from 'typeorm';

export class Account1728980939207 implements MigrationInterface {
  name = 'Account1728980939207';
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        CREATE TABLE "account" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(), 
        "domain" character varying NOT NULL, 
        "username" character varying NOT NULL, 
        "password" character varying NOT NULL, 
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), 
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), 
        "deletedAt" TIMESTAMP WITH TIME ZONE, 
        "ownerId" uuid,
        CONSTRAINT "PK_54115ee388cdb6d86bb4bf5b2ea" PRIMARY KEY ("id")
      )`);

    await queryRunner.query(
      `ALTER TABLE "account" 
      ADD CONSTRAINT 
      "FK_72719f338bfbe9aa98f4439d2b4" 
      FOREIGN KEY ("ownerId") 
      REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "account" DROP CONSTRAINT "FK_72719f338bfbe9aa98f4439d2b4"`,
    );

    await queryRunner.query(`DROP TABLE "account"`);
  }
}
