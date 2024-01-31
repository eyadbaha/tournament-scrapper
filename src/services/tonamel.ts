import infoDataSchema from "../schemas/infoData.js";
import matchesDataSchema from "../schemas/matchesData.js";
import axios from "axios";

const headers = {
  "X-Csrf-Token": process.env.TONAMEL_TOKEN,
  "Content-Type": "application/json",
  Cookie: process.env.TONAMEL_COOKIE,
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
};
const getInfo = async (id: string) => {
  const infoRequest = await axios.post(
    "https://tonamel.com/graphql/competition_management",
    {
      variables: { competitionId: id },
      query:
        "query getCompetitionDetail($competitionId: ID!) {\n  competition(id: $competitionId) {title\n    description\n game {\n      id\n      name\n}status\n    entryMenus {status\n      forParticipation\n      participantChosenNum\n      unitType\n      selectType\n      maxEntrantNum\n      countSummary {\n        currentEntrantNum}}\n    tournaments {style\n      status\n      participantSelectType\n      displayStartAt\n      isOnline\n       blockNum\n }organization {\n      id\n  }}\n}\n",
    },
    {
      headers,
    }
  );
  if (!infoRequest.data.data) throw { status: 404, errorMessagege: "Invalid Tournament ID" };
  const data = infoRequest.data.data.competition;
  const title = data.title;
  const details = data.description;
  const game = data.game.name.replace(/\b\w+\b/g, (word: string) => word.charAt(0) + word.slice(1).toLowerCase());
  const participants = data.entryMenus[0].countSummary.currentEntrantNum;
  const limit = data.entryMenus[0].participantChosenNum;
  const organizer = data.organization.id;
  const url = `tonamel.com/competition/${id}`;
  const tags = [];
  if (game.toLocaleLowerCase().includes("links")) {
    if (title.toLocaleLowerCase().includes("rush") || title.toLocaleLowerCase().includes("ラッシュ")) {
      tags.push("rd");
    } else tags.push("sd");
  } else if (game.toLocaleLowerCase().includes("master")) {
    tags.push("md");
  }
  let state = 1;
  if (data.status == "OPENED") {
    if (data.entryMenus[0].status == "NOT_OPENED" || data.entryMenus[0].status == "SUSPENDED") state = -1;
    else if (data.entryMenus[0].status == "OPEN") state = 0;
  } else if (data.status == "CLOSED") state = 2;
  else if (data.status == "SUSPENDED") state = -1;
  const date = parseInt(data.tournaments[0].displayStartAt, 10);
  const response = { title, details, game, participants, limit, organizer, url, tags, state, date };
  const res = infoDataSchema.parse(response);
  return res;
};
const getBrackets = async (id: string) => {
  const matchesRequest = await axios.post(
    `https://tonamel.com/graphql/competition/${id}`,
    {
      variables: {
        blockFilter: { first: 0, after: "", last: 0, before: "", side: "BOTH" },
        matchupFilter: { first: 0, after: "", last: 0, before: "" },
      },
      query:
        "query GetPlayerTournament($blockFilter: BlockFilter!, $matchupFilter: MatchupFilter!) {\n  blocks(filter: $blockFilter) {\n    edges {\n      node {side\n      matchups(filter: $matchupFilter) {\n          edges {\n            node {status\n round\n             competitors {\n                edges {\n                  node {status\n      scores {\n                      score\n   }\n                    participant {playerId} }}}}}}}}}}",
    },
    {
      headers,
    }
  );
  const playersRequest = await axios.post(
    `https://tonamel.com/graphql/competition/${id}`,
    {
      variables: { blockFilter: { first: 0, after: "", last: 0, before: "", side: "BOTH" } },
      query:
        "query GetPodiums($blockFilter: BlockFilter!) {\n  blocks(filter: $blockFilter) {\n    edges {\n      node {result {\n          podium {\n            place\n            participant {\n              playerId}}\n          excludedParticipants {playerId\n            playerName\n  }}}}}}",
    },
    {
      headers,
    }
  );
  if (!matchesRequest.data.data || !playersRequest.data.data)
    throw { status: 404, errorMessagege: "Invalid Tournament ID" };
  if (playersRequest.data.data.blocks.edges.length == 0)
    throw { status: 400, errorMessagege: "Tournament Results are not finalized" };
  const players = playersRequest.data.data.blocks.edges[0].node.result.podium.map((podium: any) => {
    return {
      place: podium.place,
      id: podium.participant.playerId,
    };
  });
  const matches = matchesRequest.data.data.blocks.edges
    .map((edge: any) => {
      return edge.node.matchups.edges;
    })
    .flat(1)
    .map((edge: any) => {
      const node = edge.node;
      const round = node.round;
      const player1 = node.competitors.edges[0];
      const player2 = node.competitors.edges[1];
      if (player1 && player2) {
        const players = [
          { id: player1.node.participant.playerId, score: player1.node.scores[0].score },
          { id: player2.node.participant.playerId, score: player2.node.scores[0].score },
        ];
        return { round, players };
      }
      return null;
    })
    .filter(Boolean);
  const datas = {
    players,
    matches: matches,
  };
  const res = matchesDataSchema.parse(datas);
  return res;
};
export default { getInfo, getBrackets };
