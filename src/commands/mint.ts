import { fetchCandyMachine } from "@metaplex-foundation/mpl-core-candy-machine";
import { publicKey } from "@metaplex-foundation/umi";
import PromisePool from "@supercharge/promise-pool";
import { mintFromCandyMachine } from "../core/candy-machine";
import { createContext } from "../core/umi";
import { readCache } from "../storage/cache";
import { readSolanaConfig } from "../storage/solana";
import {
  CacheCommandArgs,
  CandyMachineCommandArgs,
  CommandArgs,
  MintCommandArgs,
} from "./command";

export type MintArgs = CommandArgs &
  CacheCommandArgs &
  CandyMachineCommandArgs &
  MintCommandArgs;

export async function mint({
  rpcUrl,
  keypair,
  cache,
  priorityFee,
  candyMachine: candyMachineAddress,
  number = 1,
  receiver,
  attributes,
}: MintArgs) {
  const [sugarRpcUrl, sugarKeypair] = readSolanaConfig(rpcUrl, keypair);
  const umi = createContext(sugarRpcUrl, sugarKeypair, priorityFee);

  if (!candyMachineAddress) {
    const sugarCache = readCache(cache);
    candyMachineAddress = sugarCache.program.candyMachine!;
  }
  const candyMachine = await fetchCandyMachine(
    umi,
    publicKey(candyMachineAddress)
  );

  console.info(
    "Minting",
    number,
    "NFTs to",
    receiver || umi.identity.publicKey,
    "..."
  );

  const items = Array.withSize(number, 0);
  const { results, errors } = await PromisePool.for(items)
    .withConcurrency(8)
    .process(() =>
      mintFromCandyMachine(
        umi,
        candyMachine,
        receiver ? publicKey(receiver) : undefined,
        attributes
          ? attributes.split(",").map((a) => a.split("=") as [string, string])
          : undefined
      )
    );

  if (errors.length > 0) {
    console.info(
      "Failed to confirm the mint of",
      errors.length,
      ", please run show command to check"
    );
    console.error(errors);
  } else {
    console.info(number, "NFTs minted to", receiver || umi.identity.publicKey);
    console.info("NFTs addresses:");
    console.info(results.join("\n"));
  }
}
