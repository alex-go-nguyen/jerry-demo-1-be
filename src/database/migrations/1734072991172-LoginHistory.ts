import { MigrationInterface, QueryRunner } from 'typeorm';

export class LoginHistory1734072991172 implements MigrationInterface {
  name = 'LoginHistory1734072991172';
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "login_history" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(), 
        "deviceId" character varying NOT NULL, 
        "ipAddress" character varying NOT NULL, 
        "userAgent" character varying NOT NULL, 
        "address" character varying NOT NULL, 
        "lat" double precision NOT NULL, 
        "lon" double precision NOT NULL, 
        "loginTime" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), 
        "deletedAt" TIMESTAMP WITH TIME ZONE, 
        "userId" uuid, 
        CONSTRAINT "PK_fe377f36d49c39547cb6b9f0727" PRIMARY KEY ("id")
      )`,
    );
    await queryRunner.query(
      `ALTER TABLE "login_history" 
      ADD CONSTRAINT "FK_911ecf99e0f1a95668fea7cd6d8" 
      FOREIGN KEY ("userId") REFERENCES "user"("id") 
      ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "login_history" 
       DROP CONSTRAINT "FK_911ecf99e0f1a95668fea7cd6d8"`,
    );
    await queryRunner.query(`DROP TABLE "login_history"`);
  }
}
