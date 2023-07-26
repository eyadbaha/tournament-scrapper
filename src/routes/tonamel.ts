import express from "express";
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";

const tonamelRouter = express.Router();
chromium.setHeadlessMode = true;
chromium.setGraphicsMode = false;

tonamelRouter.get("/info/:id", (req, res) => {
  const id = req.params.id;
  (async () => {
    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });
    const page = await browser.newPage();
    await page.setDefaultNavigationTimeout(0);
    await page.goto(`https://tonamel.com/competition/${id}`);
    await page.waitForSelector(".title");
    const html: string = await page.content();
    let date: number =
      Date.parse(
        html.match(/\w{3} \d{1,2} \d{4} \d{1,2}:\d{2} \w{2}/)?.[0] ?? ""
      ) / 1000;
    let title = /<title>(.*) \| Tonamel/.exec(html)?.[1];
    let details =
      /Event Details<\/span>[^]*class=\"ProseMirror\"><p>([^]*)<\/p><\/div><\/div><\/div><\/section>/
        .exec(html)?.[1]
        .replace(/<br>/g, "\n")
        .replace(/<[^>]*>/g, "")
        .trim();
    if (!title || !date || !details) {
      await browser.close();
      return res.end(JSON.stringify({ message: "fetching data failed" }));
    }
    const data = { title, date, details };
    await browser.close();
    res.send(data);
  })();
});

tonamelRouter.get("/brackets/:id", (req, res) => {
  const id = req.params.id;
  (async () => {
    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });
    const page = await browser.newPage();
    await page.setDefaultNavigationTimeout(0);
    await Promise.all([
      page.goto(`https://tonamel.com/competition/${id}/tournament`),
      page.waitForSelector(".entry-name__text", { timeout: 70000 }),
    ]);
    const brackets = await page.$$(".bracket-content");
    if (brackets.length != 1) {
      await browser.close();
      res.send(
        JSON.stringify({
          message:
            "Bracket fetching is only supported in Single Elimination Tournaments",
        })
      );
    }
    const data = await page.evaluate(() => {
      const result: any[] = [];
      const bracket = document.querySelector(".bracket-content");
      const lists = bracket?.querySelectorAll(".m-matchup-card-list");
      lists?.forEach((list, listIndex) => {
        const cards = list.querySelectorAll(".matchup-card");
        cards.forEach((card) => {
          const players = Array.from(
            card.querySelectorAll(".matchup-player")
          ).map((player) => ({
            id: player.querySelector("img")?.src.match(/player\/(.*?)\//)?.[1],
            score: player.querySelector(".score-box__text")?.textContent,
          }));
          result.push({
            round: listIndex + 1,
            players,
          });
        });
      });
      return result.reverse().splice(0, 15);
    });
    await browser.close();
    res.send(JSON.stringify(data));
  })();
});

export default tonamelRouter;
