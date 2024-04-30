import { readFileSync } from "fs";
import { homedir } from "os";
import { join } from "path";
import { parse } from "yaml";

export function readSolanaConfig(rpcUrl: string, keypair: string) {
  const solanaConfig = parse(
    readFileSync(join(homedir(), ".config/solana/cli/config.yml"), "utf-8")
  );

  if (!rpcUrl) {
    rpcUrl = solanaConfig.json_rpc_url;
  }
  if (!keypair) {
    keypair = solanaConfig.keypair_path;
  }

  return [rpcUrl, keypair];
}
