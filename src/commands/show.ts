import { fetchCandyMachine } from "@metaplex-foundation/mpl-core-candy-machine";
import { publicKey } from "@metaplex-foundation/umi";
import { createContext } from "../core/umi";
import { readCache } from "../storage/cache";
import { readSolanaConfig } from "../storage/solana";
import {
  CacheCommandArgs,
  CandyMachineCommandArgs,
  CommandArgs,
} from "./command";

export type ShowArgs = CommandArgs & CacheCommandArgs & CandyMachineCommandArgs;

export async function show(
  _: any,
  { rpcUrl, keypair, cache, candyMachine: candyMachineAddress }: ShowArgs
) {
  const [sugarRpcUrl, sugarKeypair] = readSolanaConfig(rpcUrl, keypair);
  const umi = createContext(sugarRpcUrl, sugarKeypair);
  const sugarCache = readCache(cache);

  const candyMachine = await fetchCandyMachine(
    umi,
    publicKey(candyMachineAddress || sugarCache.program.candyMachine!)
  );

  console.info(JSON.stringify(candyMachine, null, 2));
}
