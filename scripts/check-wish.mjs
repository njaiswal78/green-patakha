import assert from "node:assert/strict";
import { cleanWish, wishLines } from "../public/js/catalog.js";
import { openWish, sealWish } from "../public/js/seal.js";

for (const ok of ["Happy Diwali", "शुभ दीपावली", "Love you Maa", "Class of 2026", "Aur phodo!"]) assert.equal(cleanWish(ok), ok, ok);
for (const bad of ["KYC call 9876543210", "98765 43210", "9-8-7-6-5", "visit bit.ly/x", "www.scam", "https://x", "pay@upi", "free.xyz gift"])
  assert.equal(cleanWish(bad), "", bad);
assert.equal(cleanWish("  Hi\u202e\u200b  "), "Hi");
assert.equal(cleanWish("x".repeat(100)).length, 80);
assert.equal(cleanWish("x".repeat(40), 20).length, 20);

assert.deepEqual(wishLines("Happy Diwali Maa"), ["Happy Diwali Maa"]);
assert.deepEqual(wishLines("Happy Diwali Maa, thank you for everything. Love you lots"), ["Happy Diwali Maa,", "thank you for", "everything. Love you", "lots"]);
assert.deepEqual(wishLines("x".repeat(30)), ["x".repeat(22), "x".repeat(8)]);
const long = "Wishing you and the whole family a bright, safe and very happy Diwali this year";
assert.equal(wishLines(long).join(" "), long, "no words lost");
assert.ok(wishLines(long).every((l) => l.length <= 22));

for (const w of ["Love you Maa", "शुभ दीपावली"]) {
  const s = await sealWish(w);
  assert.match(s, /^[A-Za-z0-9_-]+$/, "URL-safe");
  assert.ok(!s.includes("Love"), "not readable");
  assert.equal(await openWish(s), w);
}
const s = await sealWish("Hi");
assert.equal(await openWish(s.slice(0, -2) + (s.endsWith("AA") ? "BB" : "AA")), "", "tampered");
assert.equal(await openWish(""), "");
assert.equal(await openWish("not base64 !!"), "");
console.log("wish ok");
