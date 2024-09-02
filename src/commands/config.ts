import { publicKey } from "@metaplex-foundation/umi";
import { updateCandyMachine } from "../core/candy-machine";
import { createContext } from "../core/umi";
import { readCache } from "../storage/cache";
import { readConfig } from "../storage/config";
import { readSolanaConfig } from "../storage/solana";
import {
  CacheCommandArgs,
  CandyMachineCommandArgs,
  CommandArgs,
  ConfigCommandArgs,
} from "./command";

export type ConfigUpdateArgs = CommandArgs &
  ConfigCommandArgs &
  CacheCommandArgs &
  CandyMachineCommandArgs;

export async function configUpdate({
  rpcUrl,
  keypair,
  config,
  cache,
  candyMachine: candyMachineAddress,
  priorityFee,
}: ConfigUpdateArgs) {
  const [sugarRpcUrl, sugarKeypair] = readSolanaConfig(rpcUrl, keypair);
  const umi = createContext(sugarRpcUrl, sugarKeypair, priorityFee);
  const sugarConfig = readConfig(config);
  let sugarCache = readCache(cache);
  if (!candyMachineAddress) {
    candyMachineAddress = sugarCache.program.candyMachine!;
  }

  // update config
  await updateCandyMachine(
    umi,
    publicKey(candyMachineAddress),
    sugarCache,
    sugarConfig
  );

  console.info("Candy Machine updated");
}
