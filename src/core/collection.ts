import {
  createCollectionV1,
  pluginAuthorityPair,
  ruleSet,
} from "@metaplex-foundation/mpl-core";
import { generateSigner, publicKey } from "@metaplex-foundation/umi";
import { ItemCache } from "../storage/cache";
import { Config } from "../storage/config";
import { ContextWithFees, sendTransaction } from "./umi";

export async function createCollection(
  context: ContextWithFees,
  { name, metadata_link }: ItemCache,
  { sellerFeeBasisPoints, creators }: Config
) {
  const collection = generateSigner(context);
  await sendTransaction(
    context,
    createCollectionV1(context, {
      collection,
      name,
      uri: metadata_link!,
      plugins: [
        pluginAuthorityPair({
          type: "Royalties",
          data: {
            basisPoints: sellerFeeBasisPoints,
            creators: creators.map(({ address, share }) => ({
              address: publicKey(address),
              percentage: share,
            })),
            ruleSet: ruleSet("None"),
          },
        }),
      ],
    })
  );

  return collection.publicKey;
}
