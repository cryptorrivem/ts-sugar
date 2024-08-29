# ts-sugar

This is an experimental tool to interact with [Core Candy Machine](https://github.com/metaplex-foundation/mpl-core-candy-machine) program, and works in combination with [`sugar`](https://github.com/metaplex-foundation/sugar) so you'll need that tool installed on your system as well.

# Setup

As this hasn't yet been ported as a bin to be installed with npm publicly, you'll need to clone the repo, build it and link it to your copy.

- Install dependencies: `pnpm i`
- Build it: `pnpm build`
- Link the built folder: `npm link`

Check it's working by running `ts-sugar`.

# Environment setup

Be sure to set the `solana` cli to point to an RPC of yours (either devnet or mainnet) and the keypair that will be the authority of your Candy Machine and assets minted

# Creating a new Candy Machine

This tool works in combination with `sugar` that supports Candy Machine for Token Metadata.

# Assets

Place the assets for your CM in a folder (`assets` is the default to be picked up), enumerated from 0 to N - 1 (being N the size of the collection). Remember to also add the `collection.json` and its corresponding media file to the folder.

# Creating the config file

Follow the steps from [sugar](https://developers.metaplex.com/candy-machine/sugar/commands/config) to create the config file and follow the steps as usual.

# Uploading the assets

Again, use `sugar upload` to upload the assets to the storage selected, and await for all the assets to been pushed.

# Deploying the Candy Machine

Here you'll start using `ts-sugar`, to first create the collection asset, and then the Core Candy Machine account with the lines to be minted later.

> IMPORTANT: If you use `sugar` instead of `ts-sugar` for this step, your CM will be created for Token Metadata instead of Core, and you'll need to witdraw the CM using `sugar withdraw` and start over

To deploy the Candy Machine, just run:

```
ts-sugar deploy
```

> This process might throw some errors, if so, check the cache file to see if the `candyMachine` address was indeed created on the cluster you're using. If not, clear that field and run again.

# Verify

Run `ts-sugar verify` to check that all the lines were written to the Candy Machine. If it gives an error, run the `deploy` command again

# Moving forward

Then you may proceed to directly mint assets from the CM or add the guard for making the CM publicly minted using the rules you set for each group.

Check the `ts-sugar -h` for getting the list of available commands, there's still missing functionality to cover all cases (and new guards).

# Wrapping up

Once the mint has ended, you may withdraw the Candy Machine, recovering the rent from it.

> REMEMBER that this action is irreversible and all unminted assets are not gonna be able to be minted using this same CM
