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
  await Promise.all([
    page.goto(`https://paidiagaming.com/tournament/${id}/overview`),
    page.waitForNavigation({ waitUntil: "networkidle0" }),
  ]);
  const data = await page.evaluate(() => {
    const date = new Date(
      document.querySelector(".UpcomingSlider-subtitle")?.textContent?.replace(/ •.*/, "") ?? ""
    ).getTime();
    const game = document
      .querySelector(".UpcomingSlider-subtitle")
      ?.textContent?.match(/[^•]*\s*•\s*(\S.*\S)\s*$/)?.[1];
    const title = document.querySelector(".UpcomingSlider-title")?.textContent?.trim();
    const details = (document.querySelector(".Overview-information-desc") as HTMLElement)?.innerText;
    const participants = Number(
      document.querySelector(".viewtournament-participent")?.textContent?.match(/.*\((.*)\).*/)?.[1]
    );
    var xpathResult = document.evaluate(
      "//span[.//span[contains(text(), 'End time')] and contains(@class, 'text_part')]",
      document,
      null,
      XPathResult.FIRST_ORDERED_NODE_TYPE,
      null
    );
    const span = xpathResult.singleNodeValue as HTMLElement | undefined;
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
  await page.setDefaultNavigationTimeout(0);
  await Promise.all([
    page.goto(`https://paidiagaming.com/tournament/${id}/brackets`),
    page.waitForSelector(".Match-wrapper", { timeout: 70000 }),
  ]);
  const tournamentType = await page.evaluate(() => {
    const elements = document.querySelectorAll("p.Play-slider-detail-info");
    for (let element of elements) {
      if ((element as HTMLElement).innerText.includes("Tournament type")) {
        return (element.querySelector(".Play-slider-detail-text") as HTMLElement).innerText;
      }
    }
  });
  if (tournamentType?.includes("Single Elimination")) {
    const roundExpantionButtion = await page.$(".mat-select-placeholder");
    await Promise.all([
      roundExpantionButtion?.click(),
      page.waitForSelector(".mat-select-search-panel", { visible: true }),
    ]);
    const roundList = await page.$(".mat-select-search-panel");
    const roundOptions = await roundList?.$$("mat-option");
    const grandFinalsButton = roundOptions?.[roundOptions?.length - 1];
    const initialContent = await page.$eval(".SingleElimination-round", (el) => el.textContent);
    await grandFinalsButton?.click();
    await page.waitForFunction(
      (initialContent) => {
        const currentContent = document.querySelector(".SingleElimination-round")?.textContent;
        return currentContent !== initialContent;
      },
      {},
      initialContent
    );
    const brackets = await page.evaluate(() => {
      const matches: any[] = [];
      const rounds = document.querySelectorAll(".SingleElimination-round");
      rounds.forEach((round, roundIndex) => {
        const roundMatches = round.querySelectorAll(".Match-wrapper");

        roundMatches.forEach((match) => {
          const players = match.querySelectorAll("lib-team");

          const matchPlayers: any[] = [];
          players.forEach((player) => {
            const name = player.querySelector(".BracketMatch-items-player")?.textContent?.replace(/ /g, "");
            const score = player.querySelector(".BracketMatch-items-score")?.textContent?.replace(/ /g, "");
            matchPlayers.push({ id: name, score: score });
          });
          matches.push({ round: roundIndex, players: matchPlayers });
        });
      });
      return matches.reverse();
    });
    return res.send(JSON.stringify(brackets));
  }
  return res.send(
    JSON.stringify({
      message: "Bracket fetching is only supported for Single Elimination Tournaments",
    })
  );
});

export default padiaGamingRouter;
