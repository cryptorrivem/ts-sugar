import { Command } from "commander";

export type LogLevel = "trace" | "debug" | "info" | "warn" | "error" | "off";

export type CommandArgs = {
  priorityFee?: string;
  skipPreflight?: boolean;
  logLevel?: LogLevel;
  keypair: string;
  rpcUrl: string;
};

export type ConfigCommandArgs = {
  config: string;
};
export type CacheCommandArgs = {
  cache: string;
};
export type CandyMachineCommandArgs = {
  candyMachine: string;
};
export type MintCommandArgs = {
  number?: number;
  receiver?: string;
  attributes?: string;
};
export type CandyGuardCommandArgs = {
  candyGuard?: string;
};

declare module "commander" {
  interface Command {
    withDefaultOptions: () => Command;
    withConfigOption: () => Command;
    withCacheOption: () => Command;
    withCandyMachineArg: () => Command;
    withMintOptions: () => Command;
    withCandyMachineOption: () => Command;
    withCandyGuardOption: () => Command;
    withListOption: () => Command;
    withAuthorityOption: () => Command;
  }
}

Command.prototype.withDefaultOptions = function () {
  return this.option("-r, --rpc-url <string>", "RPC Url")
    .option("-k, --keypair", "Path to the keypair file, uses Sol config or")
    .option("-p, --priority-fee <number>", "Priority fee value", "500")
    .option("--skip-preflight", "Skip preflight check")
    .option("-l, --log-level <string>", "Log level");
};
Command.prototype.withConfigOption = function () {
  return this.option(
    "-c, --config <path>",
    "Path to the config file",
    "config.json"
  );
};
Command.prototype.withCacheOption = function () {
  return this.option("--cache <path>", "Path to the cache file", "cache.json");
};
Command.prototype.withCandyMachineArg = function () {
  return this.argument("[candyMachine]", "Address of candy machine");
};
Command.prototype.withMintOptions = function () {
  return this.option(
    "-n, --number <number>",
    "Amount of NFTs to be minted in bulk"
  )
    .option(
      "--receiver <string>",
      "Public key of the receiver of the minted NFT, defaults to keypair"
    )
    .option(
      "-a, --attributes <string>",
      "On-chain attributes for the minted NFT, (trait1=value1,trait2=value2)"
    );
};
Command.prototype.withCandyMachineOption = function () {
  return this.option("--candy-machine <string>", "Address of candy machine");
};
Command.prototype.withCandyGuardOption = function () {
  return this.option("--candy-guard <string>", "Address of the candy guard");
};
Command.prototype.withListOption = function () {
  return this.option(
    "--list",
    "List available candy machines, no withdraw performed"
  );
};
Command.prototype.withAuthorityOption = function () {
  return this.option(
    "--authority <authority>",
    "Address of authority to find candy machines for. If authority != keypair.pubkey then force --list. Defaults to keypair.pubkey"
  );
};
