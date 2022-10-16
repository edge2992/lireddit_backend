import { Post } from "../entities/Post";
import { User } from "../entities/User";
import { DataSource } from "typeorm";
import path from "path";
import { Updoot } from "../entities/Updoot";

const AppDataSource = new DataSource({
  type: "postgres",
  database: "lireddit2",
  username: "lireddit",
  password: "password",
  logging: true,
  synchronize: true,
  entities: [Post, User, Updoot],
  migrations: [path.join(__dirname, "../migrations/*")],
});

export default AppDataSource;