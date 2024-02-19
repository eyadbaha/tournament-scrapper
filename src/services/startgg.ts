import infoDataSchema from "../schemas/infoData.js";
import matchesDataSchema from "../schemas/matchesData.js";
import axios from "axios";
import playerSchema from "../schemas/player.js";

interface PlayerApiResponse {
  authorizations:
    | {
        type: string | null;
        url: string | null;
        externalId: string | null;
      }[]
    | null;
  player: {
    gamerTag: string | null;
    prefix: string | null;
  };
}
const INFO_QUERY = `query tournament($eventId: String!) {
  tournament(slug: $eventId) {
    id
    name
    numAttendees
    rules
    owner {
      id
      player {
        gamerTag
      }
    }
    events(limit:1) {
      state
      startAt
      videogame {
        name
      }
    }
  }
}`;
const PHASE_QUERY = `query tournament($eventId: String!) {
  tournament(slug: $eventId) {
    events (limit:1) {
      phases {
        id
        bracketType 
      }
    }
  }
}`;
const BRACKETS_REQUEST = `query tournament($eventId: String!,$phaseId: ID!) {
  tournament(slug: $eventId) {
    events (limit:1) {
      phases(phaseId: $phaseId) {
        sets(perPage: 31){
            nodes {
                round
                slots {
                    standing {
                        entrant {
                          participants {
                            user {
                              id
                            }
                          }
                        }
                        stats {
                            score {
                                value
                            }
                        }
                    }
                }
            }
        }
      }
      standings(query:{page:1,perPage:32}){
        nodes {
          player{
            user{
              id
            }
          }
          placement
        }
      }
    }
  }
}`;
const PLAYER_QUERY = `query player($id:ID!) {
  user(id: $id){
authorizations{
type
url
externalId
}
  player{
    gamerTag
    prefix
  }
}}`;
const starggGraphQlRequest = async (options: { query: string; variables?: Record<string, any> }) => {
  const infoRequest = await axios.post("https://api.start.gg/gql/alpha", options, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return infoRequest;
};
const token = process.env.STARTGG_TOKEN;
const getInfo = async (eventId: string) => {
  await starggGraphQlRequest({
    query: INFO_QUERY,
    variables: {
      eventId: eventId,
    },
  });
  const infoRequest = await starggGraphQlRequest({
    query: INFO_QUERY,
    variables: {
      eventId: eventId,
    },
  });
  const response = infoRequest?.data?.data?.tournament;
  if (!response) throw { status: 404, errorMessagege: "Invalid Tournament ID" };
  const markdownDetailsRequest = await axios.post(
    "https://www.start.gg/api/-/gql",
    [
      {
        operationName: "PageLayout",
        variables: { profileId: response.id, profileType: "tournament", page: "details" },
        query:
          "query PageLayout($profileType: String!, $profileId: Int!, $page: String!) {\n  profileWidgetPageLayout(\n    profileType: $profileType\n    profileId: $profileId\n    page: $page\n  ) { rows}}",
      },
    ],
    {
      headers: {
        "x-web-source": "gg-web-gql-client, gg-web-rest",
      },
    }
  );
  let markdownDetails = "";
  try {
    markdownDetails =
      markdownDetailsRequest?.data?.[0]?.data?.profileWidgetPageLayout?.rows
        .map((row: any) => {
          return row.columns?.map((column: any) => {
            return column.widgets
              ?.filter((widget: any) => {
                return widget.id === "MarkdownWidget";
              })
              ?.map((widget: any) => {
                return widget.config?.markdown;
              });
          });
        })
        ?.flat(3)
        ?.join("\n") || "";
  } catch (e) {
    console.error("Failed to extract markdown details");
  }
  const [title, date, details, game, participants, organizer] = [
    response.name,
    response.events[0].startAt * 1000,
    markdownDetails + (markdownDetails ? "\n" + response.rules || "" : response.rules || ""),
    response.events[0].videogame.name,
    response.numAttendees,
    response.owner.id,
  ];
  const statusMap: { [key: string]: number } = { CREATED: 0, ACTIVE: 1, COMPLETED: 2 };
  const stateText = response.events[0].state as string;
  const state: number = stateText in statusMap ? statusMap[stateText] : -1;
  const url = `start.gg/tournament/${eventId}`;
  const tags = [];
  if (game.toLocaleLowerCase().includes("links")) {
    if (title.toLocaleLowerCase().includes("rush")) {
      tags.push("rd");
    } else tags.push("sd");
  } else if (game.toLocaleLowerCase().includes("master")) {
    tags.push("md");
  }
  const data = { title, date, details, game, participants, state, url, tags, organizer };
  const parsedData = infoDataSchema.parse(data);
  return parsedData;
};
const getBrackets = async (eventId: string) => {
  const info = await getInfo(eventId);
  if (info.state != 2 && info.state != 1)
    throw { status: 400, errorMessagege: "Tournament Results are not finalized." };
  const phasesRequest = await starggGraphQlRequest({
    query: PHASE_QUERY,
    variables: {
      eventId: eventId,
    },
  });
  if (!phasesRequest.data.data.tournament) throw { status: 404, errorMessagege: "Invalid Tournament ID" };
  const phases = phasesRequest.data.data.tournament.events[0].phases;
  if (phases[phases.length - 1].bracketType == "SINGLE_ELIMINATION") {
    let dataRequest = await starggGraphQlRequest({
      query: BRACKETS_REQUEST,
      variables: {
        eventId: eventId,
        phaseId: phases[phases.length - 1].id,
      },
    });
    let retry = 1;
    while (dataRequest?.data?.data?.tournament?.events?.[0]?.phases?.[0]?.sets?.nodes?.length == 0) {
      dataRequest = await starggGraphQlRequest({
        query: BRACKETS_REQUEST,
        variables: {
          eventId: eventId,
          phaseId: phases[phases.length - retry].id,
        },
      });
      retry++;
    }
    const matchesData = dataRequest?.data?.data?.tournament?.events?.[0]?.phases?.[0]?.sets?.nodes
      ?.filter((set: any) => {
        return (
          typeof set.slots[0].standing.stats.score.value === "number" &&
          typeof set.slots[1].standing.stats.score.value === "number"
        );
      })
      ?.map(
        (set: {
          slots: {
            standing: {
              stats: { score: { value: number } };
              entrant: {
                participants: {
                  user: {
                    id: number;
                  };
                }[];
              };
            };
          }[];
          round: number;
        }) => {
          const player1 = {
            id: set.slots[0].standing.entrant.participants[0].user.id,
            score: set.slots[0].standing.stats.score.value,
          };
          const player2 = {
            id: set.slots[1].standing.entrant.participants[0].user.id,
            score: set.slots[1].standing.stats.score.value,
          };
          const players = [player1, player2];
          return { round: set.round, players };
        }
      );
    const playersData = dataRequest?.data?.data?.tournament?.events?.[0].standings?.nodes;
    const players = playersData.map((player: any) => {
      return { id: player.player.user.id, place: player.placement };
    });
    const data = {
      players: players,
      matches: matchesData,
    };
    const parsedData = matchesDataSchema.parse(data);
    return parsedData;
  } else if (phases[phases.length - 1].bracketType == "DOUBLE_ELIMINATION") {
    let dataRequest = await starggGraphQlRequest({
      query: BRACKETS_REQUEST,
      variables: {
        eventId: eventId,
        phaseId: phases[0].id,
      },
    });
    const matchesData = dataRequest?.data?.data?.tournament?.events?.[0]?.phases?.[0]?.sets?.nodes
      ?.filter((set: any) => {
        return (
          typeof set.slots[0].standing.stats.score.value === "number" &&
          typeof set.slots[1].standing.stats.score.value === "number"
        );
      })
      ?.map(
        (set: {
          slots: {
            standing: {
              stats: { score: { value: number } };
              entrant: {
                participants: {
                  user: {
                    id: number;
                  };
                }[];
              };
            };
          }[];
          round: number;
        }) => {
          const player1 = {
            id: set.slots[0].standing.entrant.participants[0].user.id,
            score: set.slots[0].standing.stats.score.value,
          };
          const player2 = {
            id: set.slots[1].standing.entrant.participants[0].user.id,
            score: set.slots[1].standing.stats.score.value,
          };
          const players = [player1, player2];
          return { round: set.round, players };
        }
      );
    const playersData = dataRequest?.data?.data?.tournament?.events?.[0].standings?.nodes;
    const players = playersData.map((player: any) => {
      return { id: player.player.user.id, place: player.placement };
    });
    const data = {
      players: players,
      matches: matchesData,
    };
    const parsedData = matchesDataSchema.parse(data);
    return parsedData;
  }
  throw { status: 500, errorMessagege: "Internal Server Error" };
};
const getPlayer = async (id: string) => {
  const playerRequest = await starggGraphQlRequest({
    query: PLAYER_QUERY,
    variables: {
      id: id,
    },
  });
  const data: PlayerApiResponse = playerRequest.data.data.user;
  if (!data.player) {
    return null;
  }
  const discordID: string | null = data.authorizations?.find((auth) => auth.type === "DISCORD")?.externalId || null;
  const response = playerSchema.parse({ id, type: "startgg", discordID, name: data.player.gamerTag });
  return response;
};
export default { getBrackets, getInfo, getPlayer };
