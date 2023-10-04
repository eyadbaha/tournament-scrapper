import infoDataSchema from "../schemas/infoData.js";
import matchesDataSchema from "../schemas/matchesData.js";
import getDataFromHtmlPage from "../utils/getDataFromHtmlPage.js";

const evaluateInfo = () => {
  const date = new Date(
    document.querySelector(".UpcomingSlider-subtitle")?.textContent?.replace(/ •.*/, "") ?? ""
  ).getTime();
  const game = document.querySelector(".UpcomingSlider-subtitle")?.textContent?.match(/[^•]*\s*•\s*(\S.*\S)\s*$/)?.[1];
  const title = document.querySelector(".UpcomingSlider-title")?.textContent?.trim();
  const details = document.querySelector<HTMLElement>(".Overview-information-desc")?.innerText;
  const participants = Number(
    document.querySelector(".viewtournament-participent")?.textContent?.match(/.*\((.*)\).*/)?.[1]
  );
  const span = document.evaluate(
    "//span[.//span[contains(text(), 'End time')] and contains(@class, 'text_part')]",
    document,
    null,
    XPathResult.FIRST_ORDERED_NODE_TYPE,
    null
  )?.singleNodeValue as HTMLElement | undefined;
  const endTime = new Date(span?.querySelector(".text_date")?.textContent || "").getTime();
  const timeNow = new Date().getTime();
  let state = 0;
  if (timeNow > endTime) {
    state = 2;
  } else if (timeNow < endTime && timeNow > date) {
    state = 1;
  }
  return { title, date, details, game, participants, state };
};
const evaluateBrackets = () => {
  for (const element of document.querySelectorAll<HTMLElement>("p.Play-slider-detail-info")) {
    if (element?.innerText.includes("Tournament type")) {
      const tournamentType = element.querySelector<HTMLElement>(".Play-slider-detail-text")?.innerText;
      if (!tournamentType?.includes("Single Elimination"))
        throw new Error(
          '{ "errorMessagege": "Bracket fetching is only supported for Single Elimination Tournaments" }'
        );
    }
  }
  return new Promise((resolve) => {
    const roundExpantionButtion = document.querySelector<HTMLElement>(".mat-select-placeholder");
    roundExpantionButtion?.click();
    const wait1 = setInterval(() => {
      if (document.querySelector(".mat-select-search-panel")) {
        clearInterval(wait1);
        const panel = document.querySelector(".mat-select-search-panel");
        panel?.querySelector<HTMLElement>("mat-option:last-child")?.click();
        const wait2 = setInterval(() => {
          if (document.querySelectorAll(".Match").length !== 7) {
            clearInterval(wait2);
            const data = Array.from(document.querySelectorAll(".SingleElimination-round"))
              .map((round, roundIndex) => {
                return Array.from(round.querySelectorAll(".Match-wrapper")).map((match) => {
                  return {
                    round: roundIndex,
                    players: Array.from(match.querySelectorAll("lib-team")).map((player) => {
                      return {
                        id: player.querySelector(".BracketMatch-items-player")?.textContent?.trim(),
                        score: player.querySelector(".BracketMatch-items-score")?.textContent?.trim(),
                      };
                    }),
                  };
                });
              })
              .flat()
              .reverse();
            resolve(data);
          }
        }, 100);
      }
    }, 100);
  });
};
const getBrackets = async (id: string) => {
  const data = await getDataFromHtmlPage(`https://paidiagaming.com/tournament/${id}/brackets`, evaluateBrackets);
  const parsedData = matchesDataSchema.parse(data);
  return parsedData;
};
const getInfo = async (id: string) => {
  const data = await getDataFromHtmlPage(`https://paidiagaming.com/tournament/${id}/overview`, evaluateInfo);
  const parsedData = infoDataSchema.parse(data);
  return parsedData;
};
export default { getBrackets, getInfo };
