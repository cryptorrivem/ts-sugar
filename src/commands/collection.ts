import { publicKey } from "@metaplex-foundation/umi";
import { updateCollection } from "../core/collection";
import { createContext } from "../core/umi";
import { readCache } from "../storage/cache";
import { readConfig } from "../storage/config";
import { readSolanaConfig } from "../storage/solana";
import { CacheCommandArgs, CommandArgs, ConfigCommandArgs } from "./command";

export type CollectionArgs = CommandArgs & ConfigCommandArgs & CacheCommandArgs;

export async function collectionUpdate({
  rpcUrl,
  keypair,
  config,
  cache,
  ...args
}: CollectionArgs) {
  const [sugarRpcUrl, sugarKeypair] = readSolanaConfig(rpcUrl, keypair);
  const umi = createContext(sugarRpcUrl, sugarKeypair, args);
  const sugarConfig = readConfig(config);
  let sugarCache = readCache(cache);

  // update collection
  if (!sugarCache.program.collectionMint) {
    throw new Error("Collection was not deployed");
  }
  const collection = publicKey(sugarCache.program.collectionMint);
  await updateCollection(umi, collection, sugarCache.collection!, sugarConfig);

  console.info("Collection updated:", collection);
}
