import { describe, it, expect } from "vitest";
import startgg from "../src/services/startgg.js";

describe("Startgg Api Handler", async () => {
  it("returns correct data when passed valid tournament id", async () => {
    await expect(startgg.getBrackets("duel-links-grand-prix-59")).resolves.toSatisfy((value: any) => {
      return value.players[0].id == 692322;
    });
    await expect(startgg.getInfo("duel-links-grand-prix-59")).resolves.toSatisfy((value: any) => {
      return value.title == "Duel Links Grand Prix #59";
    });
    await expect(startgg.getPlayer("649358")).resolves.toSatisfy((value: any) => {
      return value.name == "Playmaker EY";
    });
  });
  it("throws an error when passed invalid tournament id", async () => {
    await expect(startgg.getBrackets("invalid")).rejects.toThrow();
    await expect(startgg.getInfo("invalid")).rejects.toThrow();
  });
});
