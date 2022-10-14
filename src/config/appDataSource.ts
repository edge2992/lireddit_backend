import { Post } from "../entities/Post";
import { User } from "../entities/User";
import { DataSource } from "typeorm";

const AppDataSource = new DataSource({
  type: "postgres",
  database: "lireddit2",
  username: "lireddit",
  password: "password",
  logging: true,
  synchronize: true,
  entities: [Post, User],
});

export default AppDataSource;