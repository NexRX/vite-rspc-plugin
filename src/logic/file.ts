import { dirname, join } from "node:path";
import fs from "node:fs";

export function normalizePath(input: string): string {
  return input.startsWith("./")
    ? join(process.cwd(), input.slice(1)).replace(/\\/g, "/")
    : input;
}

export function writeOutputFile(path: string, content: string) {
  console.log("Writing generated RPC functions to:", path);
  fs.mkdirSync(dirname(path), { recursive: true });
  fs.writeFileSync(path, content, {
    encoding: "utf-8",
    flush: true,
  });
}
