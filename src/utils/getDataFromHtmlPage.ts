import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";
import axios from "axios";

chromium.setHeadlessMode = "new";
chromium.setGraphicsMode = false;
const getDataFromHtmlPage = async (url: string, evaluateFunction: () => any) => {
  const browser = await puppeteer.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath: await chromium.executablePath(),
    headless: chromium.headless,
  });
  try {
    await axios.head(url).catch((err) => {
      if (err.response.status == 404) {
        throw { status: 404, errorMessagege: "Tournament ID is invalid" };
      }
    });
    const page = await browser.newPage();
    await page.setRequestInterception(true);
    page.on("request", (request) => {
      if (
        request.resourceType() === "image" ||
        request.resourceType() === "font" ||
        request.resourceType() === "stylesheet" ||
        request.url().includes("ads")
      )
        request.abort();
      else request.continue();
    });
    await page.goto(url, { waitUntil: "networkidle0", timeout: 60000 });
    const data = await page.evaluate(evaluateFunction).catch((err) => {
      try {
        const error = JSON.parse(err.message);
        throw error;
      } catch (err) {
        throw err;
      }
    });
    return data;
  } catch (err) {
    throw err;
  } finally {
    await browser.close();
  }
};

export default getDataFromHtmlPage;
