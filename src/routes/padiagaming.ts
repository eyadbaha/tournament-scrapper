import express from "express";
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";

const padiaGamingRouter = express.Router();
chromium.setHeadlessMode = true;
chromium.setGraphicsMode = false;

padiaGamingRouter.get("/info/:id", async (req, res) => {
  const id = req.params.id;
  const browser = await puppeteer.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath: await chromium.executablePath(),
    headless: chromium.headless,
  });
  const page = await browser.newPage();
  await page.setDefaultNavigationTimeout(0);
  await page.goto(`https://paidiagaming.com/tournament/${id}/overview`, { waitUntil: "networkidle0" });
  const data = await page.evaluate(() => {
    const date = new Date(
      document.querySelector(".UpcomingSlider-subtitle")?.textContent?.replace(/ •.*/, "") ?? ""
    ).getTime();
    const game = document
      .querySelector(".UpcomingSlider-subtitle")
      ?.textContent?.match(/[^•]*\s*•\s*(\S.*\S)\s*$/)?.[1];
    const title = document.querySelector(".UpcomingSlider-title")?.textContent?.trim();
    const details = document.querySelector<HTMLElement>(".Overview-information-desc")?.innerText;
    const participants = Number(
      document.querySelector(".viewtournament-participent")?.textContent?.match(/.*\((.*)\).*/)?.[1]
    );
    const span = document.evaluate(
      "//span[.//span[contains(text(), 'End time')] and contains(@class, 'text_part')]",
      document,
      null,
      XPathResult.FIRST_ORDERED_NODE_TYPE,
      null
    )?.singleNodeValue as HTMLElement | undefined;
    const endTime = new Date(span?.querySelector(".text_date")?.textContent || "").getTime();
    const timeNow = new Date().getTime();
    let state = 0;
    if (timeNow > endTime) {
      state = 2;
    } else if (timeNow < endTime && timeNow > date) {
      state = 1;
    }
    return { title, date, details, game, participants, state };
  });
  res.send(JSON.stringify(data));
});
padiaGamingRouter.get("/brackets/:id", async (req, res) => {
  const id = req.params.id;
  const browser = await puppeteer.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath: await chromium.executablePath(),
    headless: chromium.headless,
  });
  const page = await browser.newPage();
  await Promise.all([
    page.goto(`https://paidiagaming.com/tournament/${id}/brackets`),
    page.waitForSelector(".Match-wrapper"),
  ]);
  const tournamentType = await page.evaluate(() => {
    for (const element of document.querySelectorAll<HTMLElement>("p.Play-slider-detail-info")) {
      if (element?.innerText.includes("Tournament type"))
        return element.querySelector<HTMLElement>(".Play-slider-detail-text")?.innerText;
    }
  });
  if (!tournamentType?.includes("Single Elimination"))
    return res.json({
      message: "Bracket fetching is only supported for Single Elimination Tournaments",
    });
  const roundExpantionButtion = await page.$(".mat-select-placeholder");
  await Promise.all([
    roundExpantionButtion?.click(),
    page.waitForSelector(".mat-select-search-panel", { visible: true }),
  ]);
  await page.click(".mat-select-search-panel mat-option:last-child");
  await page.waitForFunction(() => document.querySelectorAll(".Match").length === 7);
  const brackets = await page.evaluate(() => {
    return Array.from(document.querySelectorAll(".SingleElimination-round"))
      .map((round, roundIndex) => {
        return Array.from(round.querySelectorAll(".Match-wrapper")).map((match) => {
          return {
            round: roundIndex,
            players: Array.from(match.querySelectorAll("lib-team")).map((player) => {
              return {
                id: player.querySelector(".BracketMatch-items-player")?.textContent?.trim(),
                score: player.querySelector(".BracketMatch-items-score")?.textContent?.trim(),
              };
            }),
          };
        });
      })
      .flat()
      .reverse();
  });
  return res.json(brackets);
});
export default padiaGamingRouter;
