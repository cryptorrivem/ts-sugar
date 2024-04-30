import { mplCore } from "@metaplex-foundation/mpl-core";
import {
  GuardRepository,
  mplCandyMachine,
} from "@metaplex-foundation/mpl-core-candy-machine";
import {
  mplToolbox,
  setComputeUnitPrice,
} from "@metaplex-foundation/mpl-toolbox";
import {
  Context,
  TransactionBuilder,
  createSignerFromKeypair,
  signerIdentity,
} from "@metaplex-foundation/umi";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { base58 } from "@metaplex-foundation/umi/serializers";
import { readFileSync } from "fs";
import { sleep } from "../utils";

function readKeypair(umi: Context, keypairPath: string) {
  return umi.eddsa.createKeypairFromSecretKey(
    new Uint8Array(JSON.parse(readFileSync(keypairPath, "utf-8")))
  );
}

export type ContextWithFees = Context & {
  priorityFees?: number;
  coreGuards: GuardRepository;
};

export function createContext(
  rpc: string,
  keypairPath: string,
  priorityFees?: string
): ContextWithFees {
  let umi = createUmi(rpc, { commitment: "confirmed" })
    .use(mplToolbox())
    .use(mplCandyMachine())
    .use(mplCore());
  umi = umi.use(
    signerIdentity(createSignerFromKeypair(umi, readKeypair(umi, keypairPath)))
  );

  const result = umi as ContextWithFees;
  result.priorityFees = priorityFees ? parseInt(priorityFees) : undefined;

  return result;
}

export async function sendTransaction(
  context: ContextWithFees,
  builder: TransactionBuilder
) {
  const { blockhash, lastValidBlockHeight } =
    await context.rpc.getLatestBlockhash({ commitment: "finalized" });
  if (context.priorityFees) {
    builder = builder.prepend(
      setComputeUnitPrice(context, { microLamports: context.priorityFees })
    );
  }
  builder = builder.setBlockhash({ blockhash, lastValidBlockHeight });

  const transaction = await builder.buildAndSign(context);

  const signature = await context.rpc.sendTransaction(transaction, {
    maxRetries: 0,
  });
  const [base58Signature] = base58.deserialize(signature);
  console.info(base58Signature);

  const result = { end: false };
  try {
    await Promise.race([
      context.rpc.confirmTransaction(signature, {
        strategy: { type: "blockhash", blockhash, lastValidBlockHeight },
      }),
      new Promise<void>(async (resolve) => {
        while (!result.end) {
          await sleep(2000);
          await context.rpc.sendTransaction(transaction, {
            maxRetries: 0,
            skipPreflight: true,
          });
        }
        resolve();
      }),
    ]);
  } finally {
    result.end = true;
  }

  return base58Signature;
}
