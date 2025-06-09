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
import {
  Commitment,
  Context,
  RpcInterface,
  TransactionBuilder,
  createSignerFromKeypair,
  signerIdentity,
} from "@metaplex-foundation/umi";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { toWeb3JsTransaction } from "@metaplex-foundation/umi-web3js-adapters";
import { base58 } from "@metaplex-foundation/umi/serializers";
import { Connection } from "@solana/web3.js";
import { readFileSync } from "fs";
import { CommandArgs } from "../commands/command";
import {
  dasApi,
  DasApiInterface,
} from "@metaplex-foundation/digital-asset-standard-api";

function readKeypair(umi: Context, keypairPath: string) {
  return umi.eddsa.createKeypairFromSecretKey(
    new Uint8Array(JSON.parse(readFileSync(keypairPath, "utf-8")))
  );
}

export type ContextWithFees = Omit<Context, "rpc"> & {
  rpc: RpcInterface & DasApiInterface;
  priorityFees?: number;
  skipPreflight?: boolean;
  coreGuards: GuardRepository;
};

export function createContext(
  rpc: string,
  keypairPath: string,
  args: Pick<CommandArgs, "priorityFee" | "skipPreflight">
): ContextWithFees {
  let umi = createUmi(rpc, { commitment: "confirmed" })
    .use(mplToolbox())
    .use(mplCandyMachine())
    .use(dasApi())
    .use(mplCore());
  umi = umi.use(
    signerIdentity(createSignerFromKeypair(umi, readKeypair(umi, keypairPath)))
  );

  const result = umi as unknown as ContextWithFees;
  if (args.priorityFee) {
    result.priorityFees = args.priorityFee
      ? parseInt(args.priorityFee)
      : undefined;
  }
  if (args.skipPreflight) {
    result.skipPreflight = true;
  }

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

const SIMULATION_UNITS = 1_400_000;
const BUFFER_UNITS = 10_000;
const DEFAULT_UNITS = 200_000;
const MIN_PRIORITY_FEES = 500_000;

export async function sendTransaction(
  context: ContextWithFees,
  builder: TransactionBuilder,
  commitment: Commitment = "confirmed"
) {
  const { blockhash, lastValidBlockHeight } =
    await context.rpc.getLatestBlockhash({ commitment: "finalized" });
  builder = builder.setBlockhash({ blockhash, lastValidBlockHeight });

  let unitsConsumed: number | undefined;

  const simulation = await new Connection(
    context.rpc.getEndpoint()
  ).simulateTransaction(
    toWeb3JsTransaction(
      builder
        .add(setComputeUnitLimit(context, { units: SIMULATION_UNITS }))
        .build(context)
    ),
    {
      sigVerify: false,
    }
  );
  if (!context.skipPreflight && simulation.value.err) {
    console.info(simulation.value.logs?.join("\n"));
    return;
  }
  unitsConsumed = simulation.value.unitsConsumed;

  const units = (unitsConsumed || DEFAULT_UNITS) + BUFFER_UNITS;
  const priorityFees = Math.max(
    context.priorityFees || MIN_PRIORITY_FEES,
    MIN_PRIORITY_FEES
  );
  const transaction = await getTransaction(
    { ...context, priorityFees },
    builder,
    units
  ).buildAndSign(context);

  const signature = await context.rpc.sendTransaction(transaction, {
    skipPreflight: context.skipPreflight,
  });
  const base58Signature = logSignature(signature, context.rpc.getEndpoint());

  try {
    if (commitment === "finalized") {
      console.info("Awaiting transaction to finalize...");
    }
    await context.rpc.confirmTransaction(signature, {
      strategy: { type: "blockhash", blockhash, lastValidBlockHeight },
      commitment,
    });
  } catch (err: any) {
    console.error(err);
  }

  return base58Signature;
}

function logSignature(signature: string | Uint8Array, rpcUrl: string) {
  let base58Signature: string;
  if (typeof signature === "string") {
    base58Signature = signature;
  } else {
    base58Signature = base58.deserialize(signature)[0];
  }
  let suffix: string = "";
  if (rpcUrl.includes("devnet")) {
    suffix = "?cluster=devnet";
  }

  console.info("sent =>", `https://solscan.io/tx/${base58Signature}${suffix}`);
  return base58Signature;
}
