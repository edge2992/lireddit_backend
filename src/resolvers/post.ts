import { isAuth } from "../middleware/isAuth";
import { MyContext } from "src/types";
import { Arg, Ctx, Field, FieldResolver, InputType, Int, Mutation, ObjectType, Query, Resolver, Root, UseMiddleware } from "type-graphql";
import { Post } from "../entities/Post";
import AppDataSource from "../config/appDataSource";
import { Updoot } from "../entities/Updoot";


@InputType()
class PostInput {
  @Field()
  title: string;
  @Field()
  text: string;
}


@ObjectType()
class PaginatedPosts {
  @Field(() => [Post])
  posts: Post[];
  @Field()
  hasMore: boolean;
}

@Resolver(Post)
export class PostResolver {
  @FieldResolver(() => String)
  textSnippet(
    @Root() root: Post
  ) {
    return root.text.slice(0, 50);
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async vote(
    @Arg('postId', () => Int) postId: number,
    @Arg('value', () => Int) value: number,
    @Ctx() { req }: MyContext
  ) {
    const isUpdoot = value !== -1;
    const realValue = isUpdoot ? 1 : -1;
    const { userId } = req.session;
    const updoot = await Updoot.findOne({ where: { postId, userId } });

    // the user has voted on the post before
    // and they are changing their vote
    if (updoot && updoot.value !== realValue) {
      await AppDataSource.transaction(async (em) => {
        await em.query(`
      update updoot
      set value = $1
      where "postId" = $2 and "userId" = $3
        `, [realValue, postId, userId]);

        await em.query(`
      update post 
      set points = points + $1 
      where id = $2;
        `, [realValue * 2, postId]);
      });
    } else if (!updoot) {
      // has never voted before
      await AppDataSource.transaction(async (em) => {
        em.query(`
      insert into updoot ("userId", "postId", value)
      values ($1, $2, $3);
        `, [userId, postId, realValue]);

        await em.query(`
      update post 
      set points = points + $1 
      where id = $2;
        `, [realValue, postId]);
      });
    }
    return true;
  }

  @Query(() => PaginatedPosts)
  async posts(
    @Arg("limit", () => Int) limit: number,
    @Arg("cursor", () => String, { nullable: true }) cursor: string | null,
  ): Promise<PaginatedPosts> {
    const realLimit = Math.min(50, limit);
    const realLimitPlusOne = realLimit + 1;
    const qb = AppDataSource.getRepository(Post)
      .createQueryBuilder("p")
      .innerJoinAndSelect("p.creator", "u", "u.id = p.creatorId")
      .addOrderBy("p.createdAt", "DESC")
      .take(realLimitPlusOne);
    if (cursor) {
      qb.where('p."createdAt" < :cursor', { cursor: new Date(parseInt(cursor)) });
    }

    const posts = await qb.getMany();
    return { posts: posts.slice(0, realLimit), hasMore: posts.length === realLimitPlusOne };
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