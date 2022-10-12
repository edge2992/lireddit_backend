import { Migration } from '@mikro-orm/migrations';

export class Migration20221012121031 extends Migration {

  async up(): Promise<void> {
    this.addSql('alter table "user" add column "emaial" text not null;');
    this.addSql('alter table "user" add constraint "user_emaial_unique" unique ("emaial");');
  }

  async down(): Promise<void> {
    this.addSql('alter table "user" drop constraint "user_emaial_unique";');
    this.addSql('alter table "user" drop column "emaial";');
  }

}
