import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

// main.js(画面の起動)は、他のテストが読み込まない。消したファイルをimportしたままだと、
// テストもCIも通るのに、本番の画面だけが読み込みに失敗して、真っ白になる(PR #40で実際に起きた)
const srcDir = dirname(fileURLToPath(import.meta.url));

const listJsFiles = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return listJsFiles(path);
    return path.endsWith(".js") ? [path] : [];
  });

test("src配下のimportは、すべて実在するファイルを指している", () => {
  const missing = [];
  for (const file of listJsFiles(srcDir)) {
    const code = readFileSync(file, "utf8");
    for (const [, specifier] of code.matchAll(/(?:from|import)\s+["'](\.[^"']+)["']/g)) {
      if (!existsSync(resolve(dirname(file), specifier))) {
        missing.push(`${file.replace(srcDir, "src")} → ${specifier}`);
      }
    }
  }
  assert.deepEqual(missing, []);
});
