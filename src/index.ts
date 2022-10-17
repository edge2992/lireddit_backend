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
import Redis from "ioredis";
import AppDataSource from "./config/appDataSource";
import cors from "cors";
import { createUserLoader } from "./utils/createUserLoader";
import { createUpdootLoader } from "./utils/createUpdootLoader";

declare module "express-session" {
  interface SessionData {
    userId: number
  }
}


const main = async () => {
  await AppDataSource.initialize();

  const app = express();

  const RedisStore = connectRedis(session);
  const redis = new Redis();

  app.use(cors({
    origin: ["http://localhost:3000", "https://studio.apollographql.com"],
    credentials: true
  }))

  // !__prod__ && app.set("trust proxy", 1);

  app.use(
    session({
      name: COOKIE_NAME,
      store: new RedisStore({ client: redis, disableTouch: true }),
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 365 * 10, // 10 years
        httpOnly: true,
        // sameSite: 'lax', //csrf
        // secure: __prod__,//cookie only works in https
        sameSite: "lax",
        secure: false,
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
    context: ({ req, res }): MyContext => ({ req, res, redis, userLoader: createUserLoader(), updootLoader: createUpdootLoader() }),
  });

  await appoloServer.start();
  appoloServer.applyMiddleware({
    app,
    cors: false,
    path: '/graphql'
  });
  app.listen(4000, () => {
    console.log("server started on localhost:4000");
  });
};

main().catch(err => {
  console.log(err);
});
