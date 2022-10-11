import { __prod__ } from "./constatns";
import { Post } from "./entities/Post";
import { MikroORM } from "@mikro-orm/core";
import path from "path";

console.log("dirname: ", __dirname);
export default {
  migrations: {
    path: path.join(__dirname, "./migrations"),
    pattern: /^[\w-]+\d+\.[tj]s$/,
    disableForeignKeys: false
  },
  entities: [Post],
  dbName: "lireddit",
  type: "postgresql",
  debug: !__prod__,
  user: "lireddit",
  password: "password",
} as Parameters<typeof MikroORM.init>[0];

