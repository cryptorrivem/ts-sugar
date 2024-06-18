#!/usr/bin/env node

import { program } from "commander";
import "./commands/command";
import { deploy } from "./commands/deploy";
import { mint } from "./commands/mint";
import { show } from "./commands/show";
import { verify } from "./commands/verify";
import "./utils";
import { guardAdd, guardRemove } from "./commands/guard";
import { configUpdate } from "./commands/config";
import { withdraw } from "./commands/withdraw";

program
  .baseCommand("deploy")
  .withCacheOption()
  .withConfigOption()
  .description("Deploy cache items into candy machine config on-chain")
  .action(deploy);

program
  .baseCommand("config-update")
  .withCacheOption()
  .withConfigOption()
  .withCandyMachineOption()
  .description("Update the candy machine config on-chain")
  .action(configUpdate);

program
  .baseCommand("mint")
  .withCacheOption()
  .withMintOptions()
  .description("Deploy cache items into candy machine config on-chain")
  .action(mint);

program
  .baseCommand("show")
  .withCandyMachineArg()
  .withCacheOption()
  .description("Show the on-chain config of an existing candy machine")
  .action(show);

program
  .baseCommand("verify")
  .withCacheOption()
  .description("Verify uploaded data")
  .action(verify);

program
  .baseCommand("withdraw")
  .withCandyMachineOption()
  .withListOption()
  .withAuthorityOption()
  .description("Withdraw funds a from candy machine account closing it")
  .action(withdraw);

const guard = program.baseCommand("guard");
guard
  .command("add")
  .withConfigOption()
  .withCacheOption()
  .withCandyMachineOption()
  .withCandyGuardOption()
  .description("Add a candy guard on a candy machine")
  .action(guardAdd);
guard
  .command("remove")
  .withConfigOption()
  .withCacheOption()
  .withCandyMachineOption()
  .withCandyGuardOption()
  .description("Remove a candy guard from a candy machine")
  .action(guardRemove);

program.parse(process.argv);
