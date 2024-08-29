import { mplCore } from "@metaplex-foundation/mpl-core";
import {
  GuardRepository,
  mplCandyMachine,
} from "@metaplex-foundation/mpl-core-candy-machine";
import {
  mplToolbox,
  setComputeUnitLimit,
  setComputeUnitPrice,
} from "@metaplex-foundation/mpl-toolbox";
import { toWeb3JsTransaction } from "@metaplex-foundation/umi-web3js-adapters";
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
import { Connection } from "@solana/web3.js";

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

function getTransaction(
  context: ContextWithFees,
  builder: TransactionBuilder,
  units?: number
) {
  if (context.priorityFees) {
    builder = builder.prepend(
      setComputeUnitPrice(context, {
        microLamports: context.priorityFees,
      })
    );
  }
  if (units) {
    builder = builder.prepend(
      setComputeUnitLimit(context, {
        units,
      })
    );
  }
  return builder;
}

export async function sendTransaction(
  context: ContextWithFees,
  builder: TransactionBuilder
) {
  const { blockhash, lastValidBlockHeight } =
    await context.rpc.getLatestBlockhash({ commitment: "finalized" });
  builder = builder.setBlockhash({ blockhash, lastValidBlockHeight });

  const {
    value: { unitsConsumed, err, logs },
  } = await new Connection(context.rpc.getEndpoint()).simulateTransaction(
    toWeb3JsTransaction(builder.build(context)),
    {
      sigVerify: false,
    }
  );
  if (err) {
    console.info(logs?.join("\n"));
  }

  const units = (unitsConsumed || 100_000) + 10_000;
  const priorityFees = Math.max(
    context.priorityFees || 25_000,
    Math.ceil((25_000 * 10 ** 6) / units)
  );
  const transaction = await getTransaction(
    { ...context, priorityFees },
    builder,
    units
  ).buildAndSign(context);

  const signature = await context.rpc.sendTransaction(transaction, {
    skipPreflight: true,
  });
  const [base58Signature] = base58.deserialize(signature);
  console.info("sent =>", base58Signature);

  await context.rpc.confirmTransaction(signature, {
    strategy: { type: "blockhash", blockhash, lastValidBlockHeight },
    commitment: "confirmed",
  });

  return base58Signature;
}
