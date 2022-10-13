import "reflect-metadata";
import { COOKIE_NAME, __prod__ } from "./constants";
import express from "express";
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";
import { HelloResolver } from "./resolvers/hello";
import { PostResolver } from "./resolvers/post";
import { UserResolver } from "./resolvers/user";

import session from "express-session"
import connectRedis from "connect-redis";
import { MyContext } from "./types";
import cors from "cors";
import Redis from "ioredis";
import { DataSource } from "typeorm";
import { Post } from "./entities/Post";
import { User } from "./entities/User";

declare module "express-session" {
  interface SessionData {
    userId: number
  }
}


const main = async () => {
  const dataSource = new DataSource({
    type: "postgres",
    database: "lireddit2",
    username: "lireddit",
    password: "password",
    logging: true,
    synchronize: true,
    entities: [Post, User],
  });
  await dataSource.initialize();

  const app = express();

  const RedisStore = connectRedis(session);
  const redis = new Redis();

  app.use(cors({
    origin: ["http://localhost:3000", "https://studio.apollographql.com"],
    credentials: true
  }))
  app.use(
    session({
      name: COOKIE_NAME,
      store: new RedisStore({ client: redis, disableTouch: true }),
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 365 * 10, // 10 years
        httpOnly: true,
        sameSite: 'lax', //csrf
        secure: __prod__//cookie only works in https
      },
      saveUninitialized: false,
      secret: "qofjadkfdhhaggufakjdafh",
      resave: false,
    })
  )


  const appoloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [HelloResolver, PostResolver, UserResolver],
      validate: false
    }),
    context: ({ req, res }): MyContext => ({ req, res, redis }),
  });

  await appoloServer.start();
  appoloServer.applyMiddleware({
    app, cors: false, path: '/graphql'
  });
  app.listen(4000, () => {
    console.log("server started on localhost:4000");
  });
};

main().catch(err => {
  console.log(err);
});
