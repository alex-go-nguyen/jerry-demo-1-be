import { MigrationInterface, QueryRunner } from 'typeorm';

export class Workspace1728980943872 implements MigrationInterface {
  name = 'Workspace1728980943872';
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "workspace" (
            "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
            "name" character varying(255) NOT NULL,
            "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
            "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
            "deletedAt" TIMESTAMP WITH TIME ZONE,
            "userId" uuid,
            CONSTRAINT "PK_ca86b6f9b3be5fe26d307d09b49" PRIMARY KEY ("id")
          )`,
    );
    await queryRunner.query(
      `ALTER TABLE "workspace" ADD CONSTRAINT "FK_b48532fc84800d41cfee110682c" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "workspace" DROP CONSTRAINT "FK_b48532fc84800d41cfee110682c"`,
    );
    await queryRunner.query(`DROP TABLE "workspace"`);
  }
}
