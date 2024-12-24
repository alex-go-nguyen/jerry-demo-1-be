import { MigrationInterface, QueryRunner } from 'typeorm';

export class ContactInfo1734072254407 implements MigrationInterface {
  name = 'ContactInfo1734072254407';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "contact_info" (
            "id" uuid NOT NULL DEFAULT uuid_generate_v4(), 
            "title" character varying NOT NULL, 
            "firstName" character varying NOT NULL DEFAULT '', 
            "midName" character varying NOT NULL DEFAULT '', 
            "lastName" character varying NOT NULL DEFAULT '', 
            "street" character varying NOT NULL DEFAULT '', 
            "city" character varying NOT NULL DEFAULT '', 
            "postalCode" character varying NOT NULL DEFAULT '', 
            "country" character varying NOT NULL DEFAULT '',
            "email" character varying NOT NULL DEFAULT '', 
            "phoneNumber" character varying NOT NULL DEFAULT '',
            "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), 
            "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), 
            "deletedAt" TIMESTAMP WITH TIME ZONE, "ownerId" uuid, 
            CONSTRAINT "PK_65b98fa4ffb26dceb9192f5d496" PRIMARY KEY ("id")
        )`,
    );
    await queryRunner.query(
      `ALTER TABLE "contact_info" 
        ADD CONSTRAINT "FK_b68e64e0879bf2ccb5b588d1b61" 
        FOREIGN KEY ("ownerId") REFERENCES "user"("id") 
        ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "contact_info" 
      DROP CONSTRAINT "FK_b68e64e0879bf2ccb5b588d1b61"`,
    );
    await queryRunner.query(`DROP TABLE "contact_info"`);
  }
}
