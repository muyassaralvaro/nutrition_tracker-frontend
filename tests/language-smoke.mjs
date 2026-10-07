import assert from "node:assert/strict";

const saved = new Map();
globalThis.localStorage = { setItem: (key, value) => saved.set(key, value) };
globalThis.document = { documentElement: { lang: "en" } };
globalThis.window = new EventTarget();

const { setLanguage } = await import("../shared/language.ts");
let changes = 0;
window.addEventListener("nourish-language-change", () => changes++);

setLanguage("id");
assert.equal(document.documentElement.lang, "id");
assert.equal(saved.get("nourish_language"), "id");
assert.equal(changes, 1);

localStorage.setItem = () => { throw new Error("Storage unavailable"); };
setLanguage("en");
assert.equal(document.documentElement.lang, "en");
assert.equal(changes, 2);

console.log("Language persistence and fallback passed");
