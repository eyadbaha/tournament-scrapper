import { describe, it, expect } from "vitest";
import scrapper from "../src/services/tournamentScrape.js";

describe("Scrapper Api Handler", async () => {
  it("returns correct data when passed valid tournament id", async () => {
    await expect(scrapper.getBrackets("https://tonamel.com/competition/dMj4q")).resolves.toSatisfy((value: any) => {
      return value.players[0].id == "f4g5Q";
    });
    await expect(scrapper.getInfo("https://tonamel.com/competition/dMj4q")).resolves.toSatisfy((value: any) => {
      return value.title == "第82回水仙杯";
    });
  }, 120000);
  it("returns null when passed invalid tournament id", async () => {
    await expect(scrapper.getBrackets("invalid")).resolves.toEqual(null);
    await expect(scrapper.getInfo("invalid")).resolves.toEqual(null);
  }, 12000);
});
