import { encryptText, decryptText } from "../../src/utils/crypto";
import env from "../../src/config/env";

describe("Crypto utils", () => {
  const key =
    "rcKNGSv0y6t55LmFOJEqxBF8EevFhPvVFr2HKzP8GkUdtL84tZAOBEK/mo/4KzoI";

  beforeAll(() => {
    process.env.ENCRYPTION_KEY = key;
    // reload env if needed (already loaded), but functions use env object. set property.
    (env as unknown as { encryptionKey: string }).encryptionKey = key;
  });

  it("encrypts then decrypts back to original text", () => {
    const message = "license=ABC&bot_userid=BOT42";
    const cipher = encryptText(message);
    expect(cipher).toMatch(/^[0-9A-F]+$/);
    const plain = decryptText(cipher);
    expect(plain).toBe(message);
  });

  it("supports custom key parameter", () => {
    const customKey = "CustomKey";
    const message = "hello world";
    const cipher = encryptText(message, customKey);
    const plain = decryptText(cipher, customKey);
    expect(plain).toBe(message);
  });

  it("throws if encryption key missing", () => {
    const oldKey = env.encryptionKey;
    (env as unknown as { encryptionKey: string }).encryptionKey = "";

    expect(() => encryptText("test")).toThrow(
      "Encryption key is not configured."
    );

    (env as unknown as { encryptionKey: string }).encryptionKey = oldKey;
  });
});
