import { describe, it, expect } from "vitest";
import tonamel from "../src/services/tonamel.js";

describe("Tonamel Api Handler", async () => {
  it("returns correct data when passed valid tournament id", async () => {
    await expect(tonamel.getBrackets("dMj4q")).resolves.toSatisfy((value: any) => {
      return value.players[0].id == "f4g5Q";
    });
    await expect(tonamel.getInfo("dMj4q")).resolves.toSatisfy((value: any) => {
      return value.title == "第82回水仙杯";
    });
  }, 120000);
  it("throws an error when passed invalid tournament id", async () => {
    await expect(tonamel.getBrackets("invalid")).rejects.toThrow();
    await expect(tonamel.getInfo("invalid")).rejects.toThrow();
  }, 12000);
});
