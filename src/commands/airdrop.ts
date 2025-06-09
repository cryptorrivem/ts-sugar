import { transferV1 } from "@metaplex-foundation/mpl-core";
import { PublicKey, publicKey } from "@metaplex-foundation/umi";
import PromisePool from "@supercharge/promise-pool";
import { createContext, sendTransaction } from "../core/umi";
import { readAirdropFile } from "../storage/airdrop";
import { readCache } from "../storage/cache";
import { readSolanaConfig } from "../storage/solana";
import { AirdropCommandArgs, CacheCommandArgs, CommandArgs } from "./command";

export type AirdropArgs = CommandArgs & CacheCommandArgs & AirdropCommandArgs;

export async function airdrop({ rpcUrl, keypair, file, ...args }: AirdropArgs) {
  const [sugarRpcUrl, sugarKeypair] = readSolanaConfig(rpcUrl, keypair);
  const umi = createContext(sugarRpcUrl, sugarKeypair, args);

  let collection: PublicKey | undefined;
  if (args.cache) {
    const cache = readCache(args.cache);
    collection = cache.program.collectionMint
      ? publicKey(cache.program.collectionMint)
      : undefined;
  }

  console.info("Fetching NFTs to airdrop from", file, "...");

  const airdrop = readAirdropFile(file);
  const nfts = await umi.rpc.getAssets(airdrop.map((a) => publicKey(a.mint)));
  const ownedNfts = nfts.filter(
    (nft) => nft.ownership.owner === umi.identity.publicKey
  );

  console.info("Airdropping", ownedNfts.length, "NFTs...");

  const { errors } = await PromisePool.for(ownedNfts)
    .withConcurrency(8)
    .process(({ id }) =>
      sendTransaction(
        umi,
        transferV1(umi, {
          asset: id,
          newOwner: publicKey(
            airdrop.find((a) => a.mint === id.toString())!.receiver
          ),
          collection,
        }),
        "processed"
      )
    );

  if (errors.length > 0) {
    console.info(
      "Failed to airdrop",
      errors.length,
      "of",
      ownedNfts.length,
      ", please run command again to retry"
    );
    console.error(errors);
  } else {
    console.info(ownedNfts.length, "NFTs airdropped");
  }
}
