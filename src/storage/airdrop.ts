import { readFileSync } from "fs";

export type AirdropEntry = {
  mint: string;
  receiver: string;
};

export function readAirdropFile(file: string): AirdropEntry[] {
  if (file.endsWith(".json")) {
    return JSON.parse(readFileSync(file, "utf-8")) as AirdropEntry[];
  } else if (file.endsWith(".csv")) {
    const fileContent = readFileSync(file, "utf-8");
    const lines = fileContent.split("\n");
    return lines.map((line) => {
      const [mint, receiver] = line
        .split(/,;/)
        .map((s) => s.replaceAll('"', "").trim());
      return {
        mint,
        receiver,
      };
    });
  } else {
    throw new Error("Unsupported file type");
  }
}
