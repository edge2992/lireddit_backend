import "reflect-metadata";
import "dotenv-safe/config";
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
  const conn = await AppDataSource.initialize();
  await conn.runMigrations();

  const app = express();

  const RedisStore = connectRedis(session);
  const redis = new Redis(process.env.REDIS_URL);

  app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
  }))

  app.set("trust proxy", 1);

  app.use(
    session({
      name: COOKIE_NAME,
      store: new RedisStore({ client: redis, disableTouch: true }),
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 365 * 10, // 10 years
        httpOnly: true,
        sameSite: 'lax', //csrf
        secure: __prod__,//cookie only works in https
        domain: __prod__ ? '.edge2992.dev': undefined
      },
      saveUninitialized: false,
      secret: process.env.SESSION_SECRET,
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
  app.listen(parseInt(process.env.PORT), () => {
    console.log("server started on localhost:4000");
  });
};

main().catch(err => {
  console.log(err);
});
