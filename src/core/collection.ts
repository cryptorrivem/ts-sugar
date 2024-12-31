import {
  createCollectionV1,
  plugin,
  pluginAuthorityPair,
  ruleSet,
  updateCollectionPluginV1,
  updateCollectionV1,
} from "@metaplex-foundation/mpl-core";
import { generateSigner, PublicKey, publicKey } from "@metaplex-foundation/umi";
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

export async function updateCollection(
  context: ContextWithFees,
  collection: PublicKey,
  { name, metadata_link }: ItemCache,
  { sellerFeeBasisPoints, creators }: Config
) {
  await sendTransaction(
    context,
    updateCollectionV1(context, {
      collection,
      newName: name,
      newUri: metadata_link,
    }).add(
      updateCollectionPluginV1(context, {
        collection,
        plugin: plugin("Royalties", [
          {
            basisPoints: sellerFeeBasisPoints,
            creators: creators.map(({ address, share }) => ({
              address: publicKey(address),
              percentage: share,
            })),
            ruleSet: ruleSet("None"),
          },
        ]),
      })
    )
  );
}
