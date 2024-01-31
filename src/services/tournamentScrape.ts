import startgg from "./startgg.js";
import tonamel from "./tonamel.js";
import paidiagaming from "./paidiagaming.js";
import { DataSchema } from "../schemas/infoData.js";
import { MatchesSchema } from "../schemas/matchesData.js";

const getInfo = async (url: string): Promise<DataSchema | null> => {
  const id = /^(?:https?:\/\/)?(?:www\.)?[^/]+\/[^/]+\/([^/]+)/.exec(url)?.[1] || "";
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
  return null;
};
const getBrackets = async (url: string): Promise<MatchesSchema | null> => {
  const id = /^(?:https?:\/\/)?(?:www\.)?[^/]+\/[^/]+\/([^/]+)/.exec(url)?.[1] || "";
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
  return null;
};

export default { getInfo, getBrackets };
