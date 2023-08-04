import express from "express";
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";

const tonamelRouter = express.Router();
chromium.setHeadlessMode = true;
chromium.setGraphicsMode = false;

tonamelRouter.get("/info/:id", async (req, res) => {
  const id = req.params.id;
  const launchArgs = {
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath: await chromium.executablePath(),
    headless: chromium.headless,
  };
  const getHtml1 = async () => {
    const browser = await puppeteer.launch(launchArgs);
    const page = await browser.newPage();
    await page.setDefaultNavigationTimeout(0);
    await Promise.all([await page.goto(`https://tonamel.com/competition/${id}`), await page.waitForSelector(".title")]);
    const html: string = await page.content();
    await browser.close();
    return html;
  };
  const getHtml2 = async () => {
    const browser = await puppeteer.launch(launchArgs);
    const page = await browser.newPage();
    await page.setDefaultNavigationTimeout(0);
    await Promise.all([
      await page.goto(`https://tonamel.com/competition/${id}/participants`),
      await page.waitForSelector(".entry-name"),
    ]);
    const html: string = await page.content();
    await browser.close();
    return html;
  };
  const [html, html2] = await Promise.all([getHtml1(), getHtml2()]);
  let date: number = Date.parse(html.match(/\w{3} \d{1,2} \d{4} \d{1,2}:\d{2} \w{2}/)?.[0] ?? "");
  let title = /<title>(.*) \| Tonamel/.exec(html)?.[1];
  let details = /Event Details<\/span>[^]*class=\"ProseMirror\"><p>([^]*)<\/p><\/div><\/div><\/div><\/section>/
    .exec(html)?.[1]
    .replace(/<br>/g, "\n")
    .replace(/<[^>]*>/g, "")
    .trim();
  const game = html
    .match(/Organizer:.*?\<span.*?\<span.*?a-text--normal\"\>(.*?)\<\/span\>/)?.[1]
    ?.replace(/\b\w+\b/g, (word) => word.charAt(0) + word.slice(1).toLowerCase());
  let state = 0;
  const stateText = html.match(/Join the event!.*?\<\/div\>/)?.[0];
  const dateNow = new Date().getTime();
  if (stateText?.includes("Finished")) state = 2;
  else if (dateNow > date) state = 1;
  const participants = html2.match(
    /a-text--is-ellipsis\"\>(\d{1,4})\<\/span\>.*?Participation\<\/span\>\<\/div\>/g
  )?.length;
  if (!title || !date) {
    return res.end(JSON.stringify({ message: "fetching data failed" }));
  }
  const data = { title, date, details, game, participants, state };
  res.send(data);
});

tonamelRouter.get("/brackets/:id", async (req, res) => {
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
    page.goto(`https://tonamel.com/competition/${id}/tournament`),
    page.waitForSelector(".entry-name__text", { timeout: 70000 }),
  ]);
  const brackets = await page.$$(".bracket-content");
  if (brackets.length != 1) {
    await browser.close();
    return res.send(
      JSON.stringify({
        message: "Bracket fetching is only supported for Single Elimination Tournaments",
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
        const players = Array.from(card.querySelectorAll(".matchup-player")).map((player) => ({
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
});

export default tonamelRouter;
