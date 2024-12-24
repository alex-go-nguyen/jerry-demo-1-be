import { MigrationInterface, QueryRunner } from 'typeorm';

export class NotificationDetail1734074439455 implements MigrationInterface {
  name = 'NotificationDetail1734074439455';
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "notification_detail" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(), 
        "memberActivityLogId" uuid, 
        "accountSharingInvitationId" uuid, 
        "workspaceSharingInvitationId" uuid, 
        CONSTRAINT "REL_92098b3949215e9eeec4918ab4" UNIQUE ("memberActivityLogId"), 
        CONSTRAINT "REL_59f4a467c2831ba388f7732ef7" UNIQUE ("accountSharingInvitationId"), 
        CONSTRAINT "REL_33e16a8bbf17a2c5e99ccc2b8f" UNIQUE ("workspaceSharingInvitationId"), 
        CONSTRAINT "PK_279ad2e78191076cd85163adcce" 
        PRIMARY KEY ("id")
      )`,
    );

    await queryRunner.query(
      `ALTER TABLE "notification_detail" 
      ADD CONSTRAINT "FK_92098b3949215e9eeec4918ab42" 
      FOREIGN KEY ("memberActivityLogId") REFERENCES "member_activity_log"("id") 
      ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "notification_detail" 
      ADD CONSTRAINT "FK_59f4a467c2831ba388f7732ef7e" 
      FOREIGN KEY ("accountSharingInvitationId") REFERENCES "accounts_sharing_invitations"("id") 
      ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "notification_detail" 
      ADD CONSTRAINT "FK_33e16a8bbf17a2c5e99ccc2b8fd" 
      FOREIGN KEY ("workspaceSharingInvitationId") REFERENCES "workspaces_sharing_invitations"("id") 
      ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "notification_detail" 
        DROP CONSTRAINT "FK_33e16a8bbf17a2c5e99ccc2b8fd"`,
    );
    await queryRunner.query(
      `ALTER TABLE "notification_detail" 
      DROP CONSTRAINT "FK_59f4a467c2831ba388f7732ef7e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "notification_detail" 
      DROP CONSTRAINT "FK_92098b3949215e9eeec4918ab42"`,
    );
    await queryRunner.query(`DROP TABLE "notification_detail"`);
  }
}
