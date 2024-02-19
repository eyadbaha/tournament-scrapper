import infoDataSchema from "../schemas/infoData.js";
import matchesDataSchema from "../schemas/matchesData.js";
import axios from "axios";
import playerSchema from "../schemas/player.js";

// Headers for the Tonamel API requests
const headers = {
  "X-Csrf-Token": process.env.TONAMEL_TOKEN,
  "Content-Type": "application/json",
  Cookie: process.env.TONAMEL_COOKIE,
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
};

/**
 * Get information about a Tonamel tournament.
 * @param {string} id - Tonamel tournament ID.
 * @returns {Promise<DataSchema>} - Information about the Tonamel tournament.
 * @throws {object} - Throws an error if the tournament ID is invalid or the request fails.
 */
const getInfo = async (id: string) => {
  // Make a request to Tonamel GraphQL API to get tournament information
  const infoRequest = await axios.post(
    "https://tonamel.com/graphql/competition_management",
    {
      variables: { competitionId: id },
      query: `query getCompetitionDetail($competitionId: ID!) {
          competition(id: $competitionId) {
            title
            description
            game {
              id
              name
            }
            status
            entryMenus {
              status
              forParticipation
              participantChosenNum
              unitType
              selectType
              maxEntrantNum
              countSummary {
                currentEntrantNum
              }
            }
            tournaments {
              style
              status
              participantSelectType
              displayStartAt
              isOnline
              blockNum
            }
            organization {
              id
            }
          }
        }
        `,
    },
    {
      headers,
    }
  );

  // Handle invalid tournament ID or failed request
  if (!infoRequest.data.data) throw { status: 404, errorMessage: "Invalid Tournament ID" };

  // Parse and structure the received data
  const data = infoRequest.data.data.competition;
  const title = data.title;
  const details = data.description;
  const game = data.game.name.replace(/\b\w+\b/g, (word: any) => word.charAt(0) + word.slice(1).toLowerCase());
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
  const date = parseInt(data.tournaments[0].displayStartAt, 10) * 1000;

  // Structure the response data
  const response = { title, details, game, participants, limit, organizer, url, tags, state, date };

  // Validate and return the parsed response
  const res = infoDataSchema.parse(response);
  return res;
};

/**
 * Get tournament brackets and player information from Tonamel.
 * @param {string} id - Tonamel tournament ID.
 * @returns {Promise<MatchesSchema>} - Brackets and player information for the Tonamel tournament.
 * @throws {object} - Throws an error if the tournament ID is invalid, results are not finalized, or the request fails.
 */
const getBrackets = async (id: string) => {
  // Make requests to Tonamel GraphQL API to get tournament matches and player information
  const matchesRequest = await axios.post(
    `https://tonamel.com/graphql/competition/${id}`,
    {
      variables: {
        blockFilter: { first: 0, after: "", last: 0, before: "", side: "BOTH" },
        matchupFilter: { first: 0, after: "", last: 0, before: "" },
      },
      query: `query GetPlayerTournament($blockFilter: BlockFilter!, $matchupFilter: MatchupFilter!) {
          blocks(filter: $blockFilter) {
            edges {
              node {
                side
                matchups(filter: $matchupFilter) {
                  edges {
                    node {
                      status
                      round
                      competitors {
                        edges {
                          node {
                            status
                            scores {
                              score
                            }
                            participant {
                              playerId
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
        `,
    },
    {
      headers,
    }
  );

  const playersRequest = await axios.post(
    `https://tonamel.com/graphql/competition/${id}`,
    {
      variables: { blockFilter: { first: 0, after: "", last: 0, before: "", side: "BOTH" } },
      query: `query GetPodiums($blockFilter: BlockFilter!) {
          blocks(filter: $blockFilter) {
            edges {
              node {
                result {
                  podium {
                    place
                    participant {
                      playerId
                    }
                  }
                  excludedParticipants {
                    playerId
                    playerName
                  }
                }
              }
            }
          }
        }
        `,
    },
    {
      headers,
    }
  );

  // Handle invalid tournament ID, unfinished results, or failed request
  if (!matchesRequest.data.data || !playersRequest.data.data)
    throw { status: 404, errorMessage: "Invalid Tournament ID" };
  if (playersRequest.data.data.blocks.edges.length == 0)
    throw { status: 400, errorMessage: "Tournament Results are not finalized" };

  // Parse and structure the received data for players and matches
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

  // Structure the response data
  const datas = {
    players,
    matches: matches,
  };

  // Validate and return the parsed response
  const res = matchesDataSchema.parse(datas);
  return res;
};
const getPlayer = async (id: string) => {
  let request: any;
  try {
    request = await axios(`https://tonamel.com/player/${id}`);
  } catch (e) {
    throw { status: 404, errorMessage: "Invalid Player ID" };
  }
  const titleRegex = /<title>(.*?)\s*\| Tonamel<\/title>/;

  // Use the regular expression to get the title content
  const match = request.data.match(titleRegex);

  // Extract the title if there's a match
  const name = match ? match[1].trim() : null;
  const response = playerSchema.parse({ id, type: "tonamel", discordID: null, name });
  return response;
};
// Export the functions
export default { getInfo, getBrackets, getPlayer };
