import startgg from "./startgg.js";
import tonamel from "./tonamel.js";
import padiagaming from "./padiagaming.js";

const getInfo = async (url: string) => {
  const id = /^(?:https?:\/\/)?(?:www\.)?[^/]+\/[^/]+\/([^/]+)/.exec(url)?.[1] || "";
  if (["smash.gg", "start.gg"].some((link) => url.includes(link))) {
    const info = await startgg.getInfo(id);
    return info;
  } else if (url.includes("tonamel.com")) {
    const info = await tonamel.getInfo(id);
    return info;
  } else if (url.includes("padiagaming.com")) {
    const info = await padiagaming.getInfo(id);
    return info;
  }
  return null;
};
const getBrackets = async (url: string) => {
  const id = /^(?:https?:\/\/)?(?:www\.)?[^/]+\/[^/]+\/([^/]+)/.exec(url)?.[1] || "";
  if (["smash.gg", "start.gg"].some((link) => url.includes(link))) {
    const info = await startgg.getBrackets(id);
    return info;
  } else if (url.includes("tonamel.com")) {
    const info = await tonamel.getBrackets(id);
    return info;
  } else if (url.includes("padiagaming.com")) {
    const info = await padiagaming.getBrackets(id);
    return info;
  }
  return null;
};

export default { getInfo, getBrackets };
