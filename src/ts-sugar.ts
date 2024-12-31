#!/usr/bin/env node

import { program } from "commander";
import { collectionUpdate } from "./commands/collection";
import "./commands/command";
import { configUpdate } from "./commands/config";
import { deploy } from "./commands/deploy";
import { guardAdd, guardRemove } from "./commands/guard";
import { mint } from "./commands/mint";
import { show } from "./commands/show";
import { verify } from "./commands/verify";
import { withdraw } from "./commands/withdraw";
import "./utils";

program
  .command("deploy")
  .withDefaultOptions()
  .withCacheOption()
  .withConfigOption()
  .description("Deploy cache items into candy machine config on-chain")
  .action(deploy);

program
  .command("config-update")
  .withDefaultOptions()
  .withCacheOption()
  .withConfigOption()
  .withCandyMachineOption()
  .description("Update the candy machine config on-chain")
  .action(configUpdate);

program
  .command("mint")
  .withDefaultOptions()
  .withCacheOption()
  .withMintOptions()
  .description("Deploy cache items into candy machine config on-chain")
  .action(mint);

program
  .command("show")
  .withDefaultOptions()
  .withCacheOption()
  .withCandyMachineArg()
  .description("Show the on-chain config of an existing candy machine")
  .action(show);

program
  .command("verify")
  .withDefaultOptions()
  .withCacheOption()
  .description("Verify uploaded data")
  .action(verify);

program
  .command("withdraw")
  .withDefaultOptions()
  .withCandyMachineOption()
  .withListOption()
  .withAuthorityOption()
  .description("Withdraw funds a from candy machine account closing it")
  .action(withdraw);

const guard = program.command("guard");
guard
  .command("add")
  .withDefaultOptions()
  .withConfigOption()
  .withCacheOption()
  .withCandyMachineOption()
  .withCandyGuardOption()
  .description("Add a candy guard on a candy machine")
  .action(guardAdd);
guard
  .command("remove")
  .withDefaultOptions()
  .withConfigOption()
  .withCacheOption()
  .withCandyMachineOption()
  .withCandyGuardOption()
  .description("Remove a candy guard from a candy machine")
  .action(guardRemove);

const collection = program.command("collection");
collection
  .command("update")
  .withDefaultOptions()
  .withCacheOption()
  .withConfigOption()
  .description("Update the collection on the candy machine")
  .action(collectionUpdate);

program.parse(process.argv);
