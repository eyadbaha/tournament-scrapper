import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";
import axios from "axios";

// Set headless mode and graphics mode for Chromium
chromium.setHeadlessMode = "new";
chromium.setGraphicsMode = false;

// Function to get data from an HTML page using Puppeteer
const getDataFromHtmlPage = async (url: string, evaluateFunction: () => any) => {
  // Launch Puppeteer with Chromium
  const browser = await puppeteer.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath: await chromium.executablePath(),
    headless: chromium.headless,
  });

  try {
    // Check if the URL exists using Axios
    await axios.head(url).catch((err) => {
      if (err.response.status == 404) {
        throw { status: 404, errorMessagege: "Tournament ID is invalid" };
      }
    });

    // Create a new page and set up request interception to block unnecessary resources
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

    // Navigate to the URL and wait until the network is idle
    await page.goto(url, { waitUntil: "networkidle0", timeout: 60000 });

    // Evaluate the provided function on the page
    const data = await page.evaluate(evaluateFunction).catch((err) => {
      try {
        // Parse JSON from the error message if possible
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
    // Close the browser when done
    await browser.close();
  }
};

export default getDataFromHtmlPage;
