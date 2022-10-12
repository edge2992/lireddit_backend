import "reflect-metadata";
import { MikroORM } from "@mikro-orm/core";
import { COOKIE_NAME, __prod__ } from "./constatns";
import mikroOrmConfig from "./mikro-orm.config";
import express from "express";
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";
import { HelloResolver } from "./resolvers/hello";
import { PostResolver } from "./resolvers/post";
import { UserResolver } from "./resolvers/user";

import * as redis from 'redis';
import session from "express-session"
import connectRedis from "connect-redis";
import { MyContext } from "./types";
import cors from "cors";

declare module "express-session" {
  interface SessionData {
    userId: number
  }
}

const main = async () => {
  const orm = await MikroORM.init(mikroOrmConfig);
  await orm.getMigrator().up();
  const emFork = orm.em.fork();

  const app = express();

  const RedisStore = connectRedis(session);
  const redisClient = redis.createClient({
    legacyMode: true,
  })

  await redisClient.connect()
  app.use(cors({
    origin: ["http://localhost:3000", "https://studio.apollographql.com"],
    credentials: true
  }))
  app.use(
    session({
      name: COOKIE_NAME,
      store: new RedisStore({ client: redisClient, disableTouch: true }),
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
    context: ({ req, res }): MyContext => ({ em: emFork, req, res }),
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
