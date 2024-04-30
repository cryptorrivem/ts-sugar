import { pluginAuthorityPair } from "@metaplex-foundation/mpl-core";
import {
  CandyMachine,
  addConfigLines,
  createCandyMachine as create,
  mintAssetFromCandyMachine,
  updateCandyMachine as update,
} from "@metaplex-foundation/mpl-core-candy-machine";
import {
  PublicKey,
  generateSigner,
  some,
  unwrapOption,
} from "@metaplex-foundation/umi";
import { Cache, ItemCache } from "../storage/cache";
import { Config } from "../storage/config";
import { commonPrefix } from "../utils/prefix";
import { ContextWithFees, sendTransaction } from "./umi";
import { setComputeUnitLimit } from "@metaplex-foundation/mpl-toolbox";

export async function createCandyMachine(
  context: ContextWithFees,
  collection: PublicKey,
  cache: Cache,
  config: Config
) {
  const candyMachine = generateSigner(context);
  const names = Object.values(cache.items).map((i) => i.name);
  const prefixName = commonPrefix(names);
  const nameLength = names.reduce(
    (res, n) => Math.max(res, n.length - prefixName.length),
    0
  );
  const uris = Object.values(cache.items).map((i) => i.metadata_link!);
  const prefixUri = commonPrefix(uris);
  const uriLength = uris.reduce(
    (res, n) => Math.max(res, n.length - prefixUri.length),
    0
  );

  await sendTransaction(
    context,
    await create(context, {
      candyMachine,
      collection,
      collectionUpdateAuthority: context.identity,
      itemsAvailable: config.number,
      isMutable: config.isMutable,
      configLineSettings: config.hiddenSettings
        ? undefined
        : some({
            isSequential: config.isSequential,
            prefixName,
            nameLength,
            prefixUri,
            uriLength,
          }),
      hiddenSettings: config.hiddenSettings
        ? some(config.hiddenSettings)
        : undefined,
    })
  );

  return candyMachine.publicKey;
}

export async function writeLinesToCandyMachine(
  context: ContextWithFees,
  candyMachine: CandyMachine,
  index: number,
  items: ItemCache[]
) {
  const { prefixName, prefixUri } = unwrapOption(
    candyMachine.data.configLineSettings
  )!;
  await sendTransaction(
    context,
    addConfigLines(context, {
      candyMachine: candyMachine.publicKey,
      index,
      configLines: items.map(({ name, metadata_link }) => ({
        name: name.substring(prefixName.length),
        uri: metadata_link!.substring(prefixUri.length),
      })),
    })
  );
}

export async function mintFromCandyMachine(
  context: ContextWithFees,
  candyMachine: CandyMachine,
  assetOwner?: PublicKey,
  attributes?: [string, string][]
) {
  const asset = generateSigner(context);
  await sendTransaction(
    context,
    mintAssetFromCandyMachine(context, {
      candyMachine: candyMachine.publicKey,
      asset,
      assetOwner: assetOwner || context.identity.publicKey,
      collection: candyMachine.collectionMint,
      mintAuthority: context.identity,
      plugins: attributes
        ? [
            pluginAuthorityPair({
              type: "Attributes",
              data: {
                attributeList: attributes.map(([key, value]) => ({
                  key,
                  value,
                })),
              },
            }),
          ]
        : undefined,
    }).prepend(setComputeUnitLimit(context, { units: 75_000 }))
  );

  return asset.publicKey;
}

export async function updateCandyMachine(
  context: ContextWithFees,
  candyMachine: PublicKey,
  cache: Cache,
  config: Config
) {
  const names = Object.values(cache.items).map((i) => i.name);
  const prefixName = commonPrefix(names);
  const nameLength = names.reduce(
    (res, n) => Math.max(res, n.length - prefixName.length),
    0
  );
  const uris = Object.values(cache.items).map((i) => i.metadata_link!);
  const prefixUri = commonPrefix(uris);
  const uriLength = uris.reduce(
    (res, n) => Math.max(res, n.length - prefixUri.length),
    0
  );

  await sendTransaction(
    context,
    await update(context, {
      candyMachine,
      data: {
        itemsAvailable: config.number,
        isMutable: config.isMutable,
        configLineSettings: config.hiddenSettings
          ? null
          : some({
              isSequential: config.isSequential,
              prefixName,
              nameLength,
              prefixUri,
              uriLength,
            }),
        hiddenSettings: config.hiddenSettings
          ? some(config.hiddenSettings)
          : null,
        maxEditionSupply: 1,
      },
    })
  );
}
