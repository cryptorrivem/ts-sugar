import { getCandyMachineGpaBuilder } from "@metaplex-foundation/mpl-core-candy-machine";
import { publicKey } from "@metaplex-foundation/umi";
import { withdrawCandyMachine } from "../core/candy-machine";
import { createContext } from "../core/umi";
import { readSolanaConfig } from "../storage/solana";
import { CandyMachineCommandArgs, CommandArgs } from "./command";

export type WithdrawArgs = CommandArgs &
  CandyMachineCommandArgs & {
    list: boolean;
    authority: string;
  };

export async function withdraw({
  rpcUrl,
  keypair,
  candyMachine,
  list,
  authority,
  priorityFee,
}: WithdrawArgs) {
  const [sugarRpcUrl, sugarKeypair] = readSolanaConfig(rpcUrl, keypair);
  const umi = createContext(sugarRpcUrl, sugarKeypair, priorityFee);

  if (list || authority) {
    let auth = authority || umi.identity.publicKey;
    console.info("Listing Candy Machines for", auth, "...");
    const candyMachines = await getCandyMachineGpaBuilder(umi)
      .whereField("authority", publicKey(auth))
      .getDeserialized();
    console.info(
      candyMachines.map(
        ({ publicKey, collectionMint, data, itemsRedeemed }) => ({
          publicKey,
          collectionMint,
          size: Number(data.itemsAvailable),
          redeemed: Number(itemsRedeemed),
        })
      )
    );
  } else {
    console.info("Withdrawing Candy Machine", candyMachine, "...");
    await withdrawCandyMachine(umi, publicKey(candyMachine));
  }
}
