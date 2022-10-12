import { Migration } from '@mikro-orm/migrations';

export class Migration20221012121950 extends Migration {

  async up(): Promise<void> {
    this.addSql('alter table "user" drop constraint "user_emaial_unique";');
    this.addSql('alter table "user" rename column "emaial" to "email";');
    this.addSql('alter table "user" add constraint "user_email_unique" unique ("email");');
  }

  async down(): Promise<void> {
    this.addSql('alter table "user" drop constraint "user_email_unique";');
    this.addSql('alter table "user" rename column "email" to "emaial";');
    this.addSql('alter table "user" add constraint "user_emaial_unique" unique ("emaial");');
  }

}
