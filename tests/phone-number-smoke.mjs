import assert from "node:assert/strict";
import { normalizeNationalPhone } from "../modules/auth/pages/access/phone-number.ts";

assert.equal(normalizeNationalPhone("08123456789", "+62"), "8123456789");
assert.equal(normalizeNationalPhone("8123456789", "+62"), "8123456789");
assert.equal(normalizeNationalPhone("+62 0812 3456 789", "+62"), "8123456789");
assert.equal(normalizeNationalPhone("0062 812 3456 789", "+62"), "8123456789");
assert.equal(normalizeNationalPhone("0123456789", "+60"), "123456789");
assert.equal(normalizeNationalPhone("0", "+62"), "");

console.log("Phone prefix normalization passed");
