import assert from "node:assert/strict";
import { cleanWish } from "../public/js/catalog.js";

for (const ok of ["Happy Diwali", "शुभ दीपावली", "Love you Maa", "Class of 2026", "Aur phodo!"]) assert.equal(cleanWish(ok), ok, ok);
for (const bad of ["KYC call 9876543210", "98765 43210", "9-8-7-6-5", "visit bit.ly/x", "www.scam", "https://x", "pay@upi", "free.xyz gift"])
  assert.equal(cleanWish(bad), "", bad);
assert.equal(cleanWish("  Hi\u202e\u200b  "), "Hi");
assert.equal(cleanWish("x".repeat(40)).length, 24);
assert.equal(cleanWish("x".repeat(40), 20).length, 20);
console.log("wish ok");
