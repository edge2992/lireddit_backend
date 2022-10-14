import { isAuth } from "../middleware/isAuth";
import { MyContext } from "src/types";
import { Arg, Ctx, Field, InputType, Int, Mutation, Query, Resolver, UseMiddleware } from "type-graphql";
import { Post } from "../entities/Post";
import AppDataSource from "../config/appDataSource";

@InputType()
class PostInput {
  @Field()
  title: string;
  @Field()
  text: string;
}

@Resolver()
export class PostResolver {
  @Query(() => [Post])
  posts(
    @Arg("limit", () => Int) limit: number,
    @Arg("cursor", () => String, { nullable: true }) cursor: string | null,
  ): Promise<Post[]> {
    const realLimit = Math.min(50, limit);
    const qb = AppDataSource.getRepository(Post)
      .createQueryBuilder("p")
      .orderBy('"createdAt"', "DESC")
      .take(realLimit)
    if (cursor) {
      qb.where('"createdAt" < :cursor', { cursor: new Date(parseInt(cursor)) });
    }
    return qb.getMany()
  }

  @Query(() => Post, { nullable: true })
  post(
    @Arg('id', () => Int) id: number,
  ): Promise<Post | null> {
    return Post.findOneBy({ id });
  }

  @Mutation(() => Post)
  @UseMiddleware(isAuth)
  async createPost(
    @Arg('input') input: PostInput,
    @Ctx() { req }: MyContext,
  ): Promise<Post> {
    // 2 sql queries
    return Post.create({
      ...input, creatorId: req.session.userId
    }).save();
  }

  @Mutation(() => Post, { nullable: true })
  async updatePost(
    @Arg('id', () => Int) id: number,
    @Arg('title', () => String, { nullable: true }) title: string,
  ): Promise<Post | null> {
    const post = await Post.findOneBy({ id });
    if (!post) {
      return null
    }
    if (typeof title !== 'undefined') {
      post.title = title;
      Post.update({ id }, { title });
    }
    return post;
  }

  @Mutation(() => Boolean)
  async deletePost(
    @Arg('id', () => Int) id: number,
  ): Promise<boolean> {
    await Post.delete(id);
    return true;
  }
}