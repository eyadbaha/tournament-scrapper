import infoDataSchema from "../schemas/infoData.js";
import matchesDataSchema from "../schemas/matchesData.js";
import getDataFromHtmlPage from "../utils/getDataFromHtmlPage.js";

const evaluateInfo = () => {
  const list = document.querySelectorAll<HTMLElement>("dt.title");
  const getContentFromList = (title: string): string | undefined => {
    return (Array.from(list).filter((el) => el.textContent?.includes(title))?.[0]?.nextElementSibling as HTMLElement)
      ?.innerText;
  };
  const title = document.querySelector(
    ".a-text.a-text--x-large.a-text--dimgray.a-text--inline.a-text--normal"
  )?.textContent;
  const date = Date.parse(getContentFromList("Event Starting Time")?.match(/(.*?) -/)?.[1] || "");
  const details = getContentFromList("Event Details")?.replace(/\n\nRead More/g, "");
  const game = document
    .querySelector(".a-text.a-text--x-small.a-text--gray.a-text--inline.a-text--normal")
    ?.textContent?.replace(/\b\w+\b/g, (word) => word.charAt(0) + word.slice(1).toLowerCase());
  const limitString = getContentFromList("Participant Upper Limit")?.replace(/Players/g, "");
  const organizer = document.querySelector<HTMLElement>(
    "div.organization a div.a-flex.a-flex--flex-start.a-flex--row span.a-text.a-text--xx-small.a-text--gray.a-text--inline.a-text--normal"
  )?.innerText;
  const limit = limitString && +limitString;
  let state = 0;
  const finishState = document.querySelector(".entry-box")?.textContent?.includes("Finished") || false;
  if (finishState) state = 2;
  else if (Date.now() > date) state = 1;
  return { title, date, details, game, state, limit, organizer };
};
const evaluatePart = () => {
  return document.querySelectorAll(".m-profile-icon").length;
};
const evaluateBrackets = () => {
  const brackets = document.querySelectorAll(".bracket-content");
  if (brackets.length != 1) {
    throw new Error(`{"status":404,"errorMessagege":"Tournament has not started"}`);
  }
  const result: { round: number; players: { id: string | undefined; score: string | null | undefined }[] }[] = [];
  const bracket = document.querySelector(".bracket-content");
  const lists = bracket?.querySelectorAll(".m-matchup-card-list");
  lists?.forEach((list, listIndex) => {
    const cards = list.querySelectorAll(".m-matchup-card.matchup-card");
    cards.forEach((card) => {
      const players = Array.from(card.querySelectorAll(".matchup-player")).map((player) => {
        return {
          id: player.querySelector("img")?.src.match(/player\/(.*?)\//)?.[1],
          score: player.querySelector(".score-box__text")?.textContent,
        };
      });
      result.push({
        round: listIndex + 1,
        players,
      });
    });
  });
  const data = result.reverse().splice(0, 15);
  if (data[0].players[0].score == "-")
    throw new Error(`{"status":404,"errorMessagege":"Tournament Brackets are not Finalized"}`);
  return data;
};
const getInfo = async (id: string) => {
  const [data1, data2] = await Promise.all([
    getDataFromHtmlPage(
      `https://tonamel.com/competition/${id}`,
      // ".competition-detail-info.competition-info",
      evaluateInfo
    ),
    getDataFromHtmlPage(
      `https://tonamel.com/competition/${id}/participants`,
      // ".competition-participant-list.participant-list",
      evaluatePart
    ),
  ]);
  const safeData = infoDataSchema.parse({ ...data1, participants: data2 });
  return safeData;
};
const getBrackets = async (id: string) => {
  const data = await getDataFromHtmlPage(
    `https://tonamel.com/competition/${id}/tournament`,
    //".entry-name__text",
    evaluateBrackets
  );
  const safeData = matchesDataSchema.parse(data);
  return safeData;
};
export default { getInfo, getBrackets };
