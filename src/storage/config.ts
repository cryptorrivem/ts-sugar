import {
  BotTax,
  CandyGuardDataArgs,
  DefaultGuardSet,
  DefaultGuardSetArgs,
  fetchCandyGuard,
} from "@metaplex-foundation/mpl-core-candy-machine";
import {
  Option,
  PublicKey,
  none,
  publicKey,
  sol,
  some,
} from "@metaplex-foundation/umi";
import { base58 } from "@metaplex-foundation/umi/serializers";
import { readFileSync } from "fs";

export type CreatorConfig = {
  address: string;
  share: number;
};

export type GuardsConfig = {
  botTax?: BotTaxGuard;
  solPayment?: SolPaymentGuard;
  tokenPayment?: TokenPaymentGuard;
  startDate?: StartDateGuard;
  thirdPartySigner?: ThirdPartySignerGuard;
  tokenGate?: TokenGateGuard;
  gatekeeper?: GatekeeperGuard;
  endDate?: EndDateGuard;
  allowList?: AllowListGuard;
  mintLimit?: MintLimitGuard;
  nftPayment?: NftPaymentGuard;
  redeemedAmount?: RedeemedAmountGuard;
  addressGate?: AddressGateGuard;
  nftGate?: NftGateGuard;
  nftBurn?: NftBurnGuard;
  tokenBurn?: TokenBurnGuard;
  freezeSolPayment?: FreezeSolPaymentGuard;
  freezeTokenPayment?: FreezeTokenPaymentGuard;
  programGate?: ProgramGateGuard;
  allocation?: AllocationGuard;
  token2022Payment?: Token2022PaymentGuard;
  solFixedFee?: SolFixedFeeGuard;
  nftMintLimit?: NftMintLimitGuard;
  edition?: EditionGuard;
  assetPayment?: AssetPaymentGuard;
  assetBurn?: AssetBurnGuard;
  assetMintLimit?: AssetMintLimitGuard;
  assetBurnMulti?: AssetBurnMultiGuard;
  assetPaymentMulti?: AssetPaymentMultiGuard;
  assetGate?: AssetGateGuard;
  vanityMint?: VanityMintGuard;
};

export type BotTaxGuard = {
  value: number;
  lastInstruction: boolean;
  toGuard: () => BotTax;
};
export type SolPaymentGuard = {
  value: number;
  destination: PublicKey;
};
export type TokenPaymentGuard = {
  amount: number;
  mint: PublicKey;
  destinationAta: PublicKey;
};
export type StartDateGuard = {
  date: Date;
};
export type ThirdPartySignerGuard = {
  signerKey: PublicKey;
};
export type TokenGateGuard = {
  amount: number;
  mint: PublicKey;
};
export type GatekeeperGuard = {
  gatekeeperNetwork: PublicKey;
  expireOnUse: boolean;
};
export type EndDateGuard = {
  date: Date;
};
export type AllowListGuard = {
  merkleRoot: string;
};
export type MintLimitGuard = {
  id: number;
  limit: number;
};
export type NftPaymentGuard = {
  requiredCollection: PublicKey;
  destination: PublicKey;
};
export type RedeemedAmountGuard = {
  maximum: number;
};
export type AddressGateGuard = {
  address: PublicKey;
};
export type NftGateGuard = {
  requiredCollection: PublicKey;
};
export type NftBurnGuard = {
  requiredCollection: PublicKey;
};
export type TokenBurnGuard = {
  amount: number;
  mint: PublicKey;
};
export type FreezeSolPaymentGuard = {
  value: number;
  destination: PublicKey;
};
export type FreezeTokenPaymentGuard = {
  amount: number;
  mint: PublicKey;
  destinationAta: PublicKey;
};
export type ProgramGateGuard = {
  additional: PublicKey[];
};
export type AllocationGuard = {
  id: number;
  limit: number;
};
export type Token2022PaymentGuard = {
  amount: number;
  mint: PublicKey;
  destinationAta: PublicKey;
};
export type SolFixedFeeGuard = {
  value: number;
  destination: PublicKey;
};
export type NftMintLimitGuard = {
  id: number;
  limit: number;
  requiredCollection: PublicKey;
};
export type EditionGuard = {
  editionStartOffset: number;
};
export type AssetPaymentGuard = {
  requiredCollection: PublicKey;
  destination: PublicKey;
};
export type AssetBurnGuard = {
  requiredCollection: PublicKey;
};
export type AssetMintLimitGuard = {
  id: number;
  limit: number;
  requiredCollection: PublicKey;
};
export type AssetBurnMultiGuard = {
  requiredCollection: PublicKey;
  num: number;
};
export type AssetPaymentMultiGuard = {
  requiredCollection: PublicKey;
  destination: PublicKey;
  num: number;
};
export type AssetGateGuard = {
  requiredCollection: PublicKey;
};
export type VanityMintGuard = {
  regex: string;
};

export type Config = {
  number: number;
  sellerFeeBasisPoints: number;
  isMutable: boolean;
  isSequential: boolean;
  creators: CreatorConfig[];
  ruleSet: string;
  hiddenSettings?: HiddenSettings;
  guards: ConfigGuards | null;
};

export type HiddenSettings = {
  name: string;
  uri: string;
  hash: Uint8Array;
};
export interface ConfigGuards {
  default: GuardsConfig | null;
  groups: {
    label: string;
    guards: GuardsConfig;
  }[];
}

function withUnwrap<T>(
  value: T | undefined,
  unwrap: (value: T) => T
): T | undefined {
  return value ? unwrap(value) : undefined;
}

function parseGuards({
  botTax,
  solPayment,
  tokenPayment,
  startDate,
  thirdPartySigner,
  tokenGate,
  gatekeeper,
  endDate,
  allowList,
  mintLimit,
  nftPayment,
  redeemedAmount,
  addressGate,
  nftGate,
  nftBurn,
  tokenBurn,
  freezeSolPayment,
  freezeTokenPayment,
  programGate,
  allocation,
  token2022Payment,
  solFixedFee,
  nftMintLimit,
  edition,
  assetPayment,
  assetBurn,
  assetMintLimit,
  assetBurnMulti,
  assetPaymentMulti,
  assetGate,
  vanityMint,
}: GuardsConfig): GuardsConfig {
  return {
    botTax,
    solPayment: withUnwrap(solPayment, ({ destination, value }) => ({
      destination: publicKey(destination),
      value,
    })),
    tokenPayment: withUnwrap(
      tokenPayment,
      ({ amount, destinationAta, mint }) => ({
        amount,
        destinationAta: publicKey(destinationAta),
        mint: publicKey(mint),
      })
    ),
    startDate: withUnwrap(startDate, ({ date }) => ({ date: new Date(date) })),
    thirdPartySigner: withUnwrap(thirdPartySigner, ({ signerKey }) => ({
      signerKey: publicKey(signerKey),
    })),
    tokenGate: withUnwrap(tokenGate, ({ amount, mint }) => ({
      amount,
      mint: publicKey(mint),
    })),
    gatekeeper: withUnwrap(
      gatekeeper,
      ({ gatekeeperNetwork, expireOnUse }) => ({
        gatekeeperNetwork: publicKey(gatekeeperNetwork),
        expireOnUse,
      })
    ),
    endDate: withUnwrap(endDate, ({ date }) => ({ date: new Date(date) })),
    allowList,
    mintLimit,
    nftPayment: withUnwrap(
      nftPayment,
      ({ destination, requiredCollection }) => ({
        destination: publicKey(destination),
        requiredCollection: publicKey(requiredCollection),
      })
    ),
    redeemedAmount,
    addressGate: withUnwrap(addressGate, ({ address }) => ({
      address: publicKey(address),
    })),
    nftGate: withUnwrap(nftGate, ({ requiredCollection }) => ({
      requiredCollection: publicKey(requiredCollection),
    })),
    nftBurn: withUnwrap(nftBurn, ({ requiredCollection }) => ({
      requiredCollection: publicKey(requiredCollection),
    })),
    tokenBurn: withUnwrap(tokenBurn, ({ amount, mint }) => ({
      amount,
      mint: publicKey(mint),
    })),
    freezeSolPayment: withUnwrap(
      freezeSolPayment,
      ({ destination, value }) => ({
        destination: publicKey(destination),
        value,
      })
    ),
    freezeTokenPayment: withUnwrap(
      freezeTokenPayment,
      ({ amount, destinationAta, mint }) => ({
        amount,
        destinationAta: publicKey(destinationAta),
        mint: publicKey(mint),
      })
    ),
    programGate: withUnwrap(programGate, ({ additional }) => ({
      additional: additional.map((a) => publicKey(a)),
    })),
    allocation,
    token2022Payment: withUnwrap(
      token2022Payment,
      ({ amount, destinationAta, mint }) => ({
        amount,
        destinationAta: publicKey(destinationAta),
        mint: publicKey(mint),
      })
    ),
    solFixedFee: withUnwrap(solFixedFee, ({ value, destination }) => ({
      value,
      destination: publicKey(destination),
    })),
    nftMintLimit: withUnwrap(
      nftMintLimit,
      ({ id, limit, requiredCollection }) => ({
        id,
        limit,
        requiredCollection: publicKey(requiredCollection),
      })
    ),
    edition,
    assetPayment: withUnwrap(
      assetPayment,
      ({ requiredCollection, destination }) => ({
        requiredCollection: publicKey(requiredCollection),
        destination: publicKey(destination),
      })
    ),
    assetBurn: withUnwrap(assetBurn, ({ requiredCollection }) => ({
      requiredCollection: publicKey(requiredCollection),
    })),
    assetMintLimit: withUnwrap(
      assetMintLimit,
      ({ id, limit, requiredCollection }) => ({
        id,
        limit,
        requiredCollection: publicKey(requiredCollection),
      })
    ),
    assetBurnMulti: withUnwrap(
      assetBurnMulti,
      ({ requiredCollection, num }) => ({
        requiredCollection: publicKey(requiredCollection),
        num,
      })
    ),
    assetPaymentMulti: withUnwrap(
      assetPaymentMulti,
      ({ requiredCollection, destination, num }) => ({
        requiredCollection: publicKey(requiredCollection),
        destination: publicKey(destination),
        num,
      })
    ),
    assetGate: withUnwrap(assetGate, ({ requiredCollection }) => ({
      requiredCollection: publicKey(requiredCollection),
    })),
    vanityMint,
  };
}

function withWrap<T, V>(
  value: T | undefined,
  wrap: (value: T) => V
): Option<V> {
  return value ? some(wrap(value)) : none<V>();
}

function mapGuards({
  botTax,
  solPayment,
  tokenPayment,
  startDate,
  thirdPartySigner,
  tokenGate,
  gatekeeper,
  endDate,
  allowList,
  mintLimit,
  nftPayment,
  redeemedAmount,
  addressGate,
  nftGate,
  nftBurn,
  tokenBurn,
  freezeSolPayment,
  freezeTokenPayment,
  programGate,
  allocation,
  token2022Payment,
  solFixedFee,
  nftMintLimit,
  edition,
  assetPayment,
  assetBurn,
  assetMintLimit,
  assetBurnMulti,
  assetPaymentMulti,
  assetGate,
  vanityMint,
}: GuardsConfig): Omit<DefaultGuardSet, ""> {
  fetchCandyGuard;
  return {
    botTax: withWrap(botTax, ({ value, lastInstruction }) => ({
      lamports: sol(value),
      lastInstruction,
    })),
    solPayment: withWrap(solPayment, ({ destination, value }) => ({
      destination,
      lamports: sol(value),
    })),
    tokenPayment: withWrap(
      tokenPayment,
      ({ amount, destinationAta, mint }) => ({
        amount: BigInt(amount),
        destinationAta,
        mint,
      })
    ),
    startDate: withWrap(startDate, ({ date }) => ({
      date: BigInt(Math.floor(date.getTime() / 1000)),
    })),
    thirdPartySigner: withWrap(thirdPartySigner, ({ signerKey }) => ({
      signerKey,
    })),
    tokenGate: withWrap(tokenGate, ({ amount, mint }) => ({
      amount: BigInt(amount),
      mint,
    })),
    gatekeeper: withWrap(gatekeeper, ({ expireOnUse, gatekeeperNetwork }) => ({
      expireOnUse,
      gatekeeperNetwork,
    })),
    endDate: withWrap(endDate, ({ date }) => ({
      date: BigInt(Math.floor(date.getTime() / 1000)),
    })),
    allowList: withWrap(allowList, ({ merkleRoot }) => ({
      merkleRoot: new Uint8Array(Buffer.from(merkleRoot, "hex")),
    })),
    mintLimit: withWrap(mintLimit, ({ id, limit }) => ({ id, limit })),
    nftPayment: withWrap(nftPayment, ({ destination, requiredCollection }) => ({
      destination,
      requiredCollection,
    })),
    redeemedAmount: withWrap(redeemedAmount, ({ maximum }) => ({
      maximum: BigInt(maximum),
    })),
    addressGate: withWrap(addressGate, ({ address }) => ({ address })),
    nftGate: withWrap(nftGate, ({ requiredCollection }) => ({
      requiredCollection,
    })),
    nftBurn: withWrap(nftBurn, ({ requiredCollection }) => ({
      requiredCollection,
    })),
    tokenBurn: withWrap(tokenBurn, ({ amount, mint }) => ({
      amount: BigInt(amount),
      mint,
    })),
    freezeSolPayment: withWrap(freezeSolPayment, ({ value, destination }) => ({
      lamports: sol(value),
      destination,
    })),
    freezeTokenPayment: withWrap(
      freezeTokenPayment,
      ({ amount, destinationAta, mint }) => ({
        amount: BigInt(amount),
        destinationAta,
        mint,
      })
    ),
    programGate: withWrap(programGate, ({ additional }) => ({ additional })),
    allocation: withWrap(allocation, ({ id, limit }) => ({ id, limit })),
    token2022Payment: withWrap(
      token2022Payment,
      ({ amount, destinationAta, mint }) => ({
        amount: BigInt(amount),
        destinationAta,
        mint,
      })
    ),
    solFixedFee: withWrap(solFixedFee, ({ value, destination }) => ({
      lamports: sol(value),
      destination,
    })),
    nftMintLimit: withWrap(
      nftMintLimit,
      ({ id, limit, requiredCollection }) => ({ id, limit, requiredCollection })
    ),
    edition: withWrap(edition, ({ editionStartOffset }) => ({
      editionStartOffset,
    })),
    assetPayment: withWrap(
      assetPayment,
      ({ requiredCollection, destination }) => ({
        requiredCollection,
        destination,
      })
    ),
    assetBurn: withWrap(assetBurn, ({ requiredCollection }) => ({
      requiredCollection,
    })),
    assetMintLimit: withWrap(
      assetMintLimit,
      ({ id, limit, requiredCollection }) => ({ id, limit, requiredCollection })
    ),
    assetBurnMulti: withWrap(assetBurnMulti, ({ requiredCollection, num }) => ({
      requiredCollection,
      num,
    })),
    assetPaymentMulti: withWrap(
      assetPaymentMulti,
      ({ requiredCollection, destination, num }) => ({
        requiredCollection,
        destination,
        num,
      })
    ),
    assetGate: withWrap(assetGate, ({ requiredCollection }) => ({
      requiredCollection,
    })),
    vanityMint: withWrap(vanityMint, ({ regex }) => ({ regex })),
  };
}

export function guardsFormat(guards: Omit<ConfigGuards, "serialize">) {
  const guardData: CandyGuardDataArgs<DefaultGuardSetArgs> = {
    guards: guards.default ? mapGuards(guards.default) : {},
    groups: guards.groups.map(({ label, guards }) => ({
      label,
      guards: mapGuards(guards),
    })),
  };
  return guardData;
}

export function readConfig(configPath: string): Config {
  let { guards, hiddenSettings, ...config } = JSON.parse(
    readFileSync(configPath, "utf-8")
  ) as Config;

  if (hiddenSettings) {
    hiddenSettings = {
      ...hiddenSettings,
      hash: base58.serialize(hiddenSettings.hash.toString()),
    };
  }

  if (!guards) {
    return { ...config, hiddenSettings, guards: null };
  }
  const defaultGuard = guards.default ? parseGuards(guards.default) : null;
  const groups = guards.groups.map(({ label, guards }) => ({
    label,
    guards: parseGuards(guards),
  }));
  const parsedGuards = {
    default: defaultGuard,
    groups,
  };
  return {
    ...config,
    hiddenSettings,
    guards: parsedGuards,
  };
}
