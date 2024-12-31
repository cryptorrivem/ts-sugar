import { publicKey } from "@metaplex-foundation/umi";
import PromisePool from "@supercharge/promise-pool";
import {
  createCandyMachine,
  getMissingLinesInCandyMachine,
  writeLinesToCandyMachine,
} from "../core/candy-machine";
import { createCollection } from "../core/collection";
import { createContext } from "../core/umi";
import { readCache, saveCache } from "../storage/cache";
import { readConfig } from "../storage/config";
import { CacheCommandArgs, CommandArgs, ConfigCommandArgs } from "./command";
import { readSolanaConfig } from "../storage/solana";
import { fetchCandyMachine } from "@metaplex-foundation/mpl-core-candy-machine";

export type DeployArgs = CommandArgs &
  ConfigCommandArgs &
  CacheCommandArgs & {
    collectionMint?: string;
  };

export async function deploy({
  rpcUrl,
  keypair,
  config,
  cache,
  collectionMint,
  ...args
}: DeployArgs) {
  const [sugarRpcUrl, sugarKeypair] = readSolanaConfig(rpcUrl, keypair);
  const umi = createContext(sugarRpcUrl, sugarKeypair, args);
  const sugarConfig = readConfig(config);
  let sugarCache = readCache(cache);

  // deploy collection
  if (!sugarCache.program.collectionMint && !collectionMint) {
    if (!sugarCache.collection) {
      throw new Error("Collection was not specified");
    }
    console.info("Creating collection asset...");

    const collection = await createCollection(
      umi,
      sugarCache.collection,
      sugarConfig
    );

    sugarCache.collection.onChain = true;
    sugarCache.program.collectionMint = collection;
    saveCache(cache, sugarCache);

    console.info("Collection created:", collection);
  }
  const collection = publicKey(sugarCache.program.collectionMint!);

  if (!sugarCache.program.candyMachine) {
    console.info("Creating Candy Machine...");

    const candyMachine = await createCandyMachine(
      umi,
      collection,
      sugarCache,
      sugarConfig
    );

    sugarCache.program.candyMachine = candyMachine;
    saveCache(cache, sugarCache);

    console.info("Candy Machine created:", candyMachine);
  }
  let candyMachine = await fetchCandyMachine(
    umi,
    publicKey(sugarCache.program.candyMachine)
  );

  if (!sugarConfig.hiddenSettings) {
    const missingLines = getMissingLinesInCandyMachine(
      candyMachine,
      sugarCache
    );
    console.info(missingLines.length, "lines missing on the Candy Machine");

    const missingLinesBatches = missingLines.batch(11);
    const { errors } = await PromisePool.for(missingLinesBatches)
      .withConcurrency(5)
      .process(async (batch) => {
        const index = parseInt(batch[0][0]);
        await writeLinesToCandyMachine(
          umi,
          candyMachine,
          index,
          batch.map((b) => b[1])
        );
        batch.forEach(([i]) => (sugarCache.items[i].onChain = true));
        saveCache(cache, sugarCache);
      });

    if (errors.length > 0) {
      candyMachine = await fetchCandyMachine(
        umi,
        publicKey(sugarCache.program.candyMachine)
      );
      const missingLines = getMissingLinesInCandyMachine(
        candyMachine,
        sugarCache
      );
      console.info(
        "Failed to write",
        missingLines.length,
        "lines to Candy Machine, please retry"
      );
      console.error(errors);
    } else {
      console.info("All lines written to Candy Machine");
    }
  }
}
