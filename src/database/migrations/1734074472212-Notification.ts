import { MigrationInterface, QueryRunner } from 'typeorm';

export class Notification1734074472212 implements MigrationInterface {
  name = 'Notification1734074472212';
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "public"."notification_activitytype_enum" AS ENUM ('INVITATION_TO_WORKSPACE', 'UPDATE_AN_WORKSPACE', 'CREATE_AN_ACCOUNT', 'UPDATE_AN_ACCOUNT', 'SHARE_AN_ACCOUNT', 'DELETE_AN_ACCOUNT', 'MEMBER_SHARE_AN_ACCOUNT', 'MEMBER_SHARE_A_WORKSPACE');
    `);
    await queryRunner.query(
      `CREATE TABLE "notification" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(), 
        "receipient" character varying NOT NULL, 
        "activityType" "public"."notification_activitytype_enum" NOT NULL, 
        "isRead" boolean NOT NULL DEFAULT false, 
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), 
        "senderId" uuid, 
        "notificationDetailId" uuid, 
        CONSTRAINT "REL_47bf005c81a9ef267a12a15312" UNIQUE ("notificationDetailId"), 
        CONSTRAINT "PK_705b6c7cdf9b2c2ff7ac7872cb7" PRIMARY KEY ("id")
      )`,
    );

    await queryRunner.query(
      `ALTER TABLE "notification" 
      ADD CONSTRAINT "FK_c0af34102c13c654955a0c5078b" 
      FOREIGN KEY ("senderId") REFERENCES "user"("id") 
      ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "notification" 
      ADD CONSTRAINT "FK_47bf005c81a9ef267a12a15312f" 
      FOREIGN KEY ("notificationDetailId") REFERENCES "notification_detail"("id") 
      ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "notification" 
      DROP CONSTRAINT "FK_c0af34102c13c654955a0c5078b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "notification" 
      DROP CONSTRAINT "FK_47bf005c81a9ef267a12a15312f"`,
    );
    await queryRunner.query(`
      DROP TYPE "public"."notification_activitytype_enum";
    `);
    await queryRunner.query(`DROP TABLE "notification"`);
  }
}
