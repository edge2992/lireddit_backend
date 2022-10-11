import "reflect-metadata";
import { MikroORM } from "@mikro-orm/core";
import { __prod__ } from "./constatns";
import mikroOrmConfig from "./mikro-orm.config";
import express from "express";
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";
import { HelloResolver } from "./resolvers/hello";
import { PostResolver } from "./resolvers/post";

const main = async () => {
  const orm = await MikroORM.init(mikroOrmConfig);
  await orm.getMigrator().up();
  const emFork = orm.em.fork();

  const app = express();

  const appoloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [HelloResolver, PostResolver],
      validate: false
    }),
    context: () => ({ em: emFork })
  });

  await appoloServer.start();
  appoloServer.applyMiddleware({ app });
  app.listen(4000, () => {
    console.log("server started on localhost:4000");
  });
  // const post = emFork.create(Post, { title: "my first post"})
  // await emFork.persistAndFlush(post);
  // console.log('--------sql 2--------');
  // await emFork.nativeInsert(Post, { title: "my second post" });
  // const posts = await emFork.find(Post, {});
  // console.log(posts);
};

main().catch(err => {
  console.log(err);
});
