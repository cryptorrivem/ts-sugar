import { publicKey, unwrapOption } from "@metaplex-foundation/umi";
import PromisePool from "@supercharge/promise-pool";
import {
  createCandyMachine,
  writeLinesToCandyMachine,
} from "../core/candy-machine";
import { createCollection } from "../core/collection";
import { createContext } from "../core/umi";
import { getMissingLines, readCache, saveCache } from "../storage/cache";
import { readConfig } from "../storage/config";
import { CacheCommandArgs, CommandArgs, ConfigCommandArgs } from "./command";
import { readSolanaConfig } from "../storage/solana";
import {
  CANDY_MACHINE_HIDDEN_SECTION,
  deserializeCandyMachine,
  fetchCandyMachine,
  getHiddenSettingsSerializer,
} from "@metaplex-foundation/mpl-core-candy-machine";
import { utf8 } from "@metaplex-foundation/umi/serializers";

export type VerifyArgs = CommandArgs & CacheCommandArgs;

export async function verify({
  rpcUrl,
  keypair,
  cache,
  priorityFee,
}: VerifyArgs) {
  const [sugarRpcUrl, sugarKeypair] = readSolanaConfig(rpcUrl, keypair);
  const umi = createContext(sugarRpcUrl, sugarKeypair, priorityFee);
  const sugarCache = readCache(cache);

  const candyMachineRaw = await umi.rpc.getAccount(
    publicKey(sugarCache.program.candyMachine!)
  );
  if (!candyMachineRaw.exists) {
    throw new Error("Candy Machine not found");
  }

  const candyMachine = deserializeCandyMachine(candyMachineRaw);
  const { nameLength, prefixName, uriLength, prefixUri } = unwrapOption(
    candyMachine.data.configLineSettings
  )!;
  const lineSize = nameLength + uriLength;
  const errors: Error[] = [];
  new Array(Number(candyMachine.data.itemsAvailable))
    .fill(0)
    .forEach((_, ix) => {
      const nameStart = CANDY_MACHINE_HIDDEN_SECTION + 4 + lineSize * ix;
      const nameEnd = nameStart + nameLength;
      const uriStart = nameEnd;
      const uriEnd = uriStart + uriLength;
      const [name] = utf8.deserialize(
        candyMachineRaw.data.subarray(nameStart, nameEnd)
      );
      const [uri] = utf8.deserialize(
        candyMachineRaw.data.subarray(uriStart, uriEnd)
      );
      const item = sugarCache.items[ix.toString()];
      if (
        item.name !== prefixName + name ||
        item.metadata_link !== prefixUri + uri
      ) {
        errors.push(new Error(`Invalid name or uri for #${ix}`));
      }
    });

  if (errors.length > 0) {
    const missingLines = getMissingLines(sugarCache);
    console.info("Invalid lines:");
    console.info(missingLines.join("\n"));
  } else {
    console.info("Verification succeeded");
  }
}
