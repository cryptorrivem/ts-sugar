import {
  BotTax,
  CandyGuardDataArgs,
  DefaultGuardSet,
  DefaultGuardSetArgs,
  GuardGroupArgs,
  GuardRepository,
  GuardSetArgs,
  fetchCandyGuard,
  getCandyGuardDataSerializer,
} from "@metaplex-foundation/mpl-core-candy-machine";
import {
  Context,
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
  solFixedFee?: SolFixedFee;
  nftMintLimit?: NftMintLimit;
  edition?: Edition;
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
export type SolFixedFee = {
  value: number;
  destination: PublicKey;
};
export type NftMintLimit = {
  id: number;
  limit: number;
  requiredCollection: PublicKey;
};
export type Edition = {
  editionStartOffset: number;
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
  addressGate,
  allocation,
  allowList,
  botTax,
  endDate,
  freezeSolPayment,
  freezeTokenPayment,
  gatekeeper,
  mintLimit,
  nftBurn,
  nftGate,
  nftPayment,
  programGate,
  redeemedAmount,
  solPayment,
  startDate,
  thirdPartySigner,
  token2022Payment,
  tokenBurn,
  tokenGate,
  tokenPayment,
}: GuardsConfig): GuardsConfig {
  return {
    addressGate: withUnwrap(addressGate, ({ address }) => ({
      address: publicKey(address),
    })),
    allocation,
    allowList,
    botTax,
    endDate: withUnwrap(endDate, ({ date }) => ({ date: new Date(date) })),
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
    gatekeeper: withUnwrap(
      gatekeeper,
      ({ gatekeeperNetwork, expireOnUse }) => ({
        gatekeeperNetwork: publicKey(gatekeeperNetwork),
        expireOnUse,
      })
    ),
    mintLimit,
    nftBurn: withUnwrap(nftBurn, ({ requiredCollection }) => ({
      requiredCollection: publicKey(requiredCollection),
    })),
    nftGate: withUnwrap(nftGate, ({ requiredCollection }) => ({
      requiredCollection: publicKey(requiredCollection),
    })),
    nftPayment: withUnwrap(
      nftPayment,
      ({ destination, requiredCollection }) => ({
        destination: publicKey(destination),
        requiredCollection: publicKey(requiredCollection),
      })
    ),
    programGate: withUnwrap(programGate, ({ additional }) => ({
      additional: additional.map((a) => publicKey(a)),
    })),
    redeemedAmount,
    solPayment: withUnwrap(solPayment, ({ destination, value }) => ({
      destination: publicKey(destination),
      value,
    })),
    startDate: withUnwrap(startDate, ({ date }) => ({ date: new Date(date) })),
    thirdPartySigner: withUnwrap(thirdPartySigner, ({ signerKey }) => ({
      signerKey: publicKey(signerKey),
    })),
    token2022Payment: withUnwrap(
      token2022Payment,
      ({ amount, destinationAta, mint }) => ({
        amount,
        destinationAta: publicKey(destinationAta),
        mint: publicKey(mint),
      })
    ),
    tokenBurn: withUnwrap(tokenBurn, ({ amount, mint }) => ({
      amount,
      mint: publicKey(mint),
    })),
    tokenGate: withUnwrap(tokenGate, ({ amount, mint }) => ({
      amount,
      mint: publicKey(mint),
    })),
    tokenPayment: withUnwrap(
      tokenPayment,
      ({ amount, destinationAta, mint }) => ({
        amount,
        destinationAta: publicKey(destinationAta),
        mint: publicKey(mint),
      })
    ),
  };
}

function withWrap<T, V>(
  value: T | undefined,
  wrap: (value: T) => V
): Option<V> {
  return value ? some(wrap(value)) : none<V>();
}

function mapGuards({
  addressGate,
  allocation,
  allowList,
  botTax,
  endDate,
  freezeSolPayment,
  freezeTokenPayment,
  gatekeeper,
  mintLimit,
  nftBurn,
  nftGate,
  nftMintLimit,
  nftPayment,
  programGate,
  redeemedAmount,
  solPayment,
  solFixedFee,
  startDate,
  thirdPartySigner,
  token2022Payment,
  tokenBurn,
  tokenGate,
  tokenPayment,
  edition,
}: GuardsConfig): DefaultGuardSet {
  fetchCandyGuard;
  return {
    addressGate: withWrap(addressGate, ({ address }) => ({ address })),
    allocation: withWrap(allocation, ({ id, limit }) => ({ id, limit })),
    allowList: withWrap(allowList, ({ merkleRoot }) => ({
      merkleRoot: new Uint8Array(Buffer.from(merkleRoot, "hex")),
    })),
    botTax: withWrap(botTax, ({ value, lastInstruction }) => ({
      lamports: sol(value),
      lastInstruction,
    })),
    edition: withWrap(edition, ({ editionStartOffset }) => ({
      editionStartOffset,
    })),
    endDate: withWrap(endDate, ({ date }) => ({
      date: BigInt(Math.floor(date.getTime() / 1000)),
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
    gatekeeper: withWrap(gatekeeper, ({ expireOnUse, gatekeeperNetwork }) => ({
      expireOnUse,
      gatekeeperNetwork,
    })),
    mintLimit: withWrap(mintLimit, ({ id, limit }) => ({ id, limit })),
    nftBurn: withWrap(nftBurn, ({ requiredCollection }) => ({
      requiredCollection,
    })),
    nftGate: withWrap(nftGate, ({ requiredCollection }) => ({
      requiredCollection,
    })),
    nftMintLimit: withWrap(
      nftMintLimit,
      ({ id, limit, requiredCollection }) => ({ id, limit, requiredCollection })
    ),
    nftPayment: withWrap(nftPayment, ({ destination, requiredCollection }) => ({
      destination,
      requiredCollection,
    })),
    programGate: withWrap(programGate, ({ additional }) => ({ additional })),
    redeemedAmount: withWrap(redeemedAmount, ({ maximum }) => ({
      maximum: BigInt(maximum),
    })),
    solPayment: withWrap(solPayment, ({ destination, value }) => ({
      destination,
      lamports: sol(value),
    })),
    solFixedFee: withWrap(solFixedFee, ({ value, destination }) => ({
      lamports: sol(value),
      destination,
    })),
    startDate: withWrap(startDate, ({ date }) => ({
      date: BigInt(Math.floor(date.getTime() / 1000)),
    })),
    thirdPartySigner: withWrap(thirdPartySigner, ({ signerKey }) => ({
      signerKey,
    })),
    token2022Payment: withWrap(
      token2022Payment,
      ({ amount, destinationAta, mint }) => ({
        amount: BigInt(amount),
        destinationAta,
        mint,
      })
    ),
    tokenBurn: withWrap(tokenBurn, ({ amount, mint }) => ({
      amount: BigInt(amount),
      mint,
    })),
    tokenGate: withWrap(tokenGate, ({ amount, mint }) => ({
      amount: BigInt(amount),
      mint,
    })),
    tokenPayment: withWrap(
      tokenPayment,
      ({ amount, destinationAta, mint }) => ({
        amount: BigInt(amount),
        destinationAta,
        mint,
      })
    ),
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
