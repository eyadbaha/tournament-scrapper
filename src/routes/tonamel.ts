import express from "express";
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";
import infoDataSchema from "../schemas/infoData.js";
import matchesDataSchema from "../schemas/matchesData.js";
import errorHandleMap from "../utils/errorMessages.js";

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
  const getHtml = async (url: string, selector: string): Promise<{ data: string; status: number }> => {
    const browser = await puppeteer.launch(launchArgs);
    const page = await browser.newPage();
    let status = 0;
    page.on("response", (response: any) => {
      if (!response.ok() && response.request().isNavigationRequest()) {
        status = response.status();
        page.close();
      }
    });
    try {
      await Promise.all([await page.goto(url), await page.waitForSelector(selector)]);
      const html = await page.content();
      return { data: html, status: 200 };
    } catch (err) {
      console.log(err);
      return { data: "", status };
    } finally {
      browser.close();
    }
  };
  const [html, html2] = await Promise.all([
    getHtml(`https://tonamel.com/competition/${id}`, ".competition-detail-info.competition-info"),
    getHtml(`https://tonamel.com/competition/${id}/participants`, ".competition-participant-list.participant-list"),
  ]);
  if (!html.data || !html2.data)
    return res.status(errorHandleMap.has(html.status) ? html.status : 500).json(errorHandleMap.get(html.status));
  let date: number = Date.parse(html.data.match(/\w{3} \d{1,2} \d{4} \d{1,2}:\d{2} \w{2}/)?.[0] ?? "");
  let title = /<title>(.*) \| Tonamel/.exec(html.data)?.[1];
  let details = /Event Details<\/span>[^]*class=\"ProseMirror\"><p>([^]*)<\/p><\/div><\/div><\/div><\/section>/
    .exec(html.data)?.[1]
    .replace(/<br>/g, "\n")
    .replace(/<[^>]*>/g, "")
    .trim();
  const game = html.data
    .match(/Organizer:.*?\<span.*?\<span.*?a-text--normal\"\>(.*?)\<\/span\>/)?.[1]
    ?.replace(/\b\w+\b/g, (word) => word.charAt(0) + word.slice(1).toLowerCase());
  let state = 0;
  const stateText = html.data.match(/Join the event!.*?\<\/div\>/)?.[0];
  const dateNow = new Date().getTime();
  if (stateText?.includes("Finished")) state = 2;
  else if (dateNow > date) state = 1;
  const participants =
    html2.data.match(/a-text--is-ellipsis\"\>(\d{1,4})\<\/span\>.*?Participation\<\/span\>\<\/div\>/g)?.length || 0;
  const data = { title, date, details, game, participants, state };
  try {
    const safeData = infoDataSchema.parse(data);
    res.send(safeData);
  } catch (err) {
    console.log(err);
    res.status(500).send(errorHandleMap.get(500));
  }
});

tonamelRouter.get("/brackets/:id", async (req, res) => {
  const id = req.params.id;
  const browser = await puppeteer.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath: await chromium.executablePath(),
    headless: chromium.headless,
  });
  try {
    const getData = async (): Promise<{ data: any[]; status: number }> => {
      const page = await browser.newPage();
      let status: number | undefined = undefined;
      page.on("response", (response: any) => {
        if (!response.ok() && response.request().isNavigationRequest()) {
          status = response.status();
          page.close();
        }
      });
      try {
        await Promise.all([
          page.goto(`https://tonamel.com/competition/${id}/tournament`),
          page.waitForSelector(".entry-name__text"),
        ]);
        const brackets = await page.$$(".bracket-content");
        if (brackets.length != 1) {
          await browser.close();
          return { data: [], status: 400 };
        }
        const data = await page.evaluate(() => {
          const result: any[] = [];
          const bracket = document.querySelector(".bracket-content");
          const lists = bracket?.querySelectorAll(".m-matchup-card-list");
          lists?.forEach((list, listIndex) => {
            const cards = list.querySelectorAll(".m-matchup-card.matchup-card");
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
        return { data, status: 200 };
      } catch (err) {
        return { data: [], status: status || 500 };
      } finally {
        browser.close();
      }
    };
    const data = await getData();
    if (!data.data.length)
      return res.status(errorHandleMap.has(data.status) ? data.status : 500).json(errorHandleMap.get(data.status));
    const safeData = matchesDataSchema.parse(data.data);
    res.send(JSON.stringify(safeData));
  } catch (err) {
    console.log(err);
    res.status(500).send(errorHandleMap.get(500));
  }
});
export default tonamelRouter;
