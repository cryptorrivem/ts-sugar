import {
  deleteCandyGuard,
  fetchCandyMachine,
  findCandyGuardPda,
  getCandyGuardDataSerializer,
  unwrap,
  updateCandyGuard,
} from "@metaplex-foundation/mpl-core-candy-machine";
import { createCandyGuard } from "@metaplex-foundation/mpl-core-candy-machine/dist/src/generated/instructions/createCandyGuard";
import { generateSigner, publicKey } from "@metaplex-foundation/umi";
import { createContext, sendTransaction } from "../core/umi";
import { readCache } from "../storage/cache";
import { guardsFormat, readConfig } from "../storage/config";
import { readSolanaConfig } from "../storage/solana";
import {
  CacheCommandArgs,
  CandyGuardCommandArgs,
  CandyMachineCommandArgs,
  CommandArgs,
  ConfigCommandArgs,
} from "./command";

export type GuardArgs = CommandArgs &
  ConfigCommandArgs &
  CacheCommandArgs &
  CandyMachineCommandArgs &
  CandyGuardCommandArgs;

export async function guardAdd({
  rpcUrl,
  keypair,
  config,
  cache,
  priorityFee,
  candyMachine: candyMachineAddress,
  candyGuard: candyGuardAddress,
}: GuardArgs) {
  const [sugarRpcUrl, sugarKeypair] = readSolanaConfig(rpcUrl, keypair);
  const umi = createContext(sugarRpcUrl, sugarKeypair, priorityFee);
  const sugarConfig = readConfig(config);

  if (!candyMachineAddress) {
    const sugarCache = readCache(cache);
    candyMachineAddress = sugarCache.program.candyMachine!;
  }

  const candyMachine = await fetchCandyMachine(
    umi,
    publicKey(candyMachineAddress)
  );

  if (!candyMachine) {
    throw new Error(`Candy Machine ${candyMachineAddress} not found`);
  }

  console.info("Candy Machine ID:", candyMachineAddress);

  if (!candyGuardAddress) {
    const sugarCache = readCache(cache);
    candyGuardAddress = sugarCache.program.candyGuard;
  }

  if (!candyGuardAddress) {
    console.info("Initializing a candy guard");
    const base = generateSigner(umi);
    const [candyGuard] = findCandyGuardPda(umi, { base: base.publicKey });
    const formatted = guardsFormat(sugarConfig.guards!);
    await sendTransaction(
      umi,
      createCandyGuard(umi, {
        base,
        data: getCandyGuardDataSerializer(
          umi,
          umi.programs.get("mplCoreCandyGuard")
        ).serialize(formatted),
        authority: umi.identity.publicKey,
        candyGuard,
      })
    );
  } else {
    console.info("Loading candy guard");
    const candyGuard = publicKey(candyGuardAddress);
    const { guards, groups } = guardsFormat(sugarConfig.guards!);
    await sendTransaction(
      umi,
      updateCandyGuard(umi, {
        candyGuard,
        guards,
        groups,
      })
    );
  }
}

export async function guardRemove({
  rpcUrl,
  keypair,
  config,
  cache,
  priorityFee,
  candyMachine: candyMachineAddress,
  candyGuard: candyGuardAddress,
}: GuardArgs) {
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

  if (!candyMachine) {
    throw new Error(`Candy Machine ${candyMachineAddress} not found`);
  }

  console.info("Candy Machine ID:", candyMachineAddress);

  if (!candyGuardAddress) {
    const sugarCache = readCache(cache);
    candyGuardAddress = sugarCache.program.candyGuard;
  }

  if (candyGuardAddress) {
    console.info("Unwrapping");
    await sendTransaction(
      umi,
      unwrap(umi, {
        candyGuard: publicKey(candyGuardAddress!),
        candyMachine: publicKey(candyMachineAddress),
      }).add(
        deleteCandyGuard(umi, { candyGuard: publicKey(candyGuardAddress!) })
      )
    );
  }
}
