import { existsSync, readFileSync, writeFileSync } from "fs";

export type ProgramCache = {
  candyMachine?: string;
  candyGuard?: string;
  collectionMint?: string;
};
export type ItemCache = {
  name: string;
  image_hash: string | null;
  image_link: string | null;
  metadata_hash: string | null;
  metadata_link: string | null;
  onChain: boolean;
};

export type Cache = {
  program: ProgramCache;
  collection?: ItemCache;
  items: Record<string, ItemCache>;
};

const COLLECTION_INDEX = "-1";

export function readCache(cachePath: string): Cache {
  if (!existsSync(cachePath)) {
    throw new Error("Cache file not found");
  }
  const cache = JSON.parse(readFileSync(cachePath, "utf-8")) as Cache;
  const collection = cache.items[COLLECTION_INDEX];
  delete cache.items[COLLECTION_INDEX];
  cache.collection = collection;
  return cache;
}

export function saveCache(cachePath: string, cache: Cache) {
  const toSave = JSON.parse(JSON.stringify(cache)) as Cache;
  if (toSave.collection) {
    toSave.items[COLLECTION_INDEX] = { ...toSave.collection };
    delete toSave.collection;
  }
  writeFileSync(cachePath, JSON.stringify(cache, null, 2), "utf-8");
}

export function getMissingLines(cache: Cache) {
  return Object.entries(cache.items).filter(([_, i]) => !i.onChain);
}
