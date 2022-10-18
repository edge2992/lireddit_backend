import DataLoader from "dataloader";
import { Updoot } from "../entities/Updoot";

export const createUpdootLoader = () => new DataLoader<{ postId: number, userId: number }, Updoot | null>(async keys => {
  const updoots = await Updoot.findBy(keys as any);
  const UpdootIdsToUpdoot: Record<string, Updoot> = {};
  updoots.forEach(u => {
    UpdootIdsToUpdoot[`${u.userId}|${u.postId}`] = u;
  })

  return keys.map((key) => UpdootIdsToUpdoot[`${key.userId}|${key.postId}`]);
});