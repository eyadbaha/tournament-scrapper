import startgg from "./startgg.js";
import tonamel from "./tonamel.js";
import paidiagaming from "./paidiagaming.js";
import { DataSchema } from "../schemas/infoData.js";
import { MatchesSchema } from "../schemas/matchesData.js";

/**
 * Get tournament information based on the provided URL.
 * @param {string} url - The URL of the tournament.
 * @returns {Promise<DataSchema | null>} - Information about the tournament.
 */
const getInfo = async (url: string): Promise<DataSchema | null> => {
  // Extract the tournament ID from the URL
  const id = /^(?:https?:\/\/)?(?:www\.)?[^/]+\/[^/]+\/([^/]+)/.exec(url)?.[1] || "";
  try {
    // Check the domain and call the appropriate method to get tournament information
    if (["smash.gg", "start.gg"].some((link) => url.includes(link))) {
      const info = await startgg.getInfo(id);
      return info;
    } else if (url.includes("tonamel.com")) {
      const info = await tonamel.getInfo(id);
      return info;
    } else if (url.includes("paidiagaming.com")) {
      const info = await paidiagaming.getInfo(id);
      return info;
    }
  } catch (e) {
    console.error(`Tournament Scrapper Encountred and error while scraping info with the url ${url}:${e}`);
  }
  // Return null if the domain is not recognized
  return null;
};

/**
 * Get tournament brackets based on the provided URL.
 * @param {string} url - The URL of the tournament.
 * @returns {Promise<MatchesSchema | null>} - Brackets of the tournament.
 */
const getBrackets = async (url: string): Promise<MatchesSchema | null> => {
  try {
    // Extract the tournament ID from the URL
    const id = /^(?:https?:\/\/)?(?:www\.)?[^/]+\/[^/]+\/([^/]+)/.exec(url)?.[1] || "";

    // Check the domain and call the appropriate method to get tournament brackets
    if (["smash.gg", "start.gg"].some((link) => url.includes(link))) {
      const info = await startgg.getBrackets(id);
      return info;
    } else if (url.includes("tonamel.com")) {
      const info = await tonamel.getBrackets(id);
      return info;
    } else if (url.includes("paidiagaming.com")) {
      const info = await paidiagaming.getBrackets(id);
      return info;
    }
  } catch (e) {
    console.error(`Tournament Scrapper Encountred and error while scraping brackets with the url ${url}:${e}`);
  }
  // Return null if the domain is not recognized
  return null;
};

export default { getInfo, getBrackets };
