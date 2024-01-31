import infoDataSchema from "../schemas/infoData.js";
import matchesDataSchema from "../schemas/matchesData.js";
import axios from "axios";

const token = process.env.STARTGG_TOKEN;
const getInfo = async (eventId: string) => {
  const infoRequest = await axios.post(
    "https://api.start.gg/gql/alpha",
    {
      query: `query tournament($eventId: String!) {
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
          }`,
      variables: {
        eventId: eventId,
      },
    },
    { headers: { Authorization: `Bearer ${token}` } }
  );

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
  const phasesRequest = await axios.post(
    "https://api.start.gg/gql/alpha",
    {
      query: `query tournament($eventId: String!) {
            tournament(slug: $eventId) {
              events (limit:1) {
                phases {
                  id
                  bracketType 
                }
              }
            }
          }`,
      variables: {
        eventId: eventId,
      },
    },
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!phasesRequest.data.data.tournament) throw { status: 404, errorMessagege: "Invalid Tournament ID" };
  const phases = phasesRequest.data.data.tournament.events[0].phases;
  if (phases[phases.length - 1].bracketType == "SINGLE_ELIMINATION") {
    let dataRequest = await axios.post(
      "https://api.start.gg/gql/alpha",
      {
        query: `query tournament($eventId: String!) {
                tournament(slug: $eventId) {
                  events (limit:1) {
                    phases(phaseId: ${phases[phases.length - 1].id}) {
                      sets(perPage: 31){
                          nodes {
                              round
                              slots {
                                  standing {
                                      entrant {
                                          id
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
                        entrant{
                          id
                        }
                        placement
                      }
                    }
                  }
                }
              }`,
        variables: {
          eventId: eventId,
        },
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    let retry = 1;
    while (dataRequest?.data?.data?.tournament?.events?.[0]?.phases?.[0]?.sets?.nodes?.length == 0) {
      dataRequest = await axios.post(
        "https://api.start.gg/gql/alpha",
        {
          query: `query tournament($eventId: String!) {
                  tournament(slug: $eventId) {
                    events (limit:1) {
                      phases(phaseId: ${phases[phases.length - retry].id}) {
                        sets(perPage: 31){
                            nodes {
                                round
                                slots {
                                    standing {
                                        entrant {
                                            id
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
                          entrant{
                            id
                          }
                          placement
                        }
                      }
                    }
                  }
                }`,
          variables: {
            eventId: eventId,
          },
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
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
          slots: { standing: { stats: { score: { value: number } }; entrant: { id: number } } }[];
          round: number;
        }) => {
          const player1 = { id: set.slots[0].standing.entrant.id, score: set.slots[0].standing.stats.score.value };
          const player2 = { id: set.slots[1].standing.entrant.id, score: set.slots[1].standing.stats.score.value };
          const players = [player1, player2];
          return { round: set.round, players };
        }
      );
    const playersData = dataRequest?.data?.data?.tournament?.events?.[0].standings?.nodes;
    const players = playersData.map((player: any) => {
      return { id: player.entrant.id, place: player.placement };
    });
    const data = {
      players: players,
      matches: matchesData,
    };
    const parsedData = matchesDataSchema.parse(data);
    return parsedData;
  } else if (phases[phases.length - 1].bracketType == "DOUBLE_ELIMINATION") {
    let dataRequest = await axios.post(
      "https://api.start.gg/gql/alpha",
      {
        query: `query tournament($eventId: String!) {
                tournament(slug: $eventId) {
                  events (limit:1) {
                    phases(phaseId: ${phases[0].id}) {
                      sets(perPage: 31){
                          nodes {
                              round
                              slots {
                                  standing {
                                      entrant {
                                          id
                                          name
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
                        entrant{
                          id
                        }
                        placement
                      }
                    }
                  }
                }
              }`,
        variables: {
          eventId: eventId,
        },
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const matchesData = dataRequest?.data?.data?.tournament?.events?.[0]?.phases?.[0]?.sets?.nodes
      ?.filter((set: any) => {
        return (
          typeof set.slots[0].standing.stats.score.value === "number" &&
          typeof set.slots[1].standing.stats.score.value === "number"
        );
      })
      ?.map(
        (set: {
          slots: { standing: { stats: { score: { value: number } }; entrant: { id: number } } }[];
          round: number;
        }) => {
          const player1 = { id: set.slots[0].standing.entrant.id, score: set.slots[0].standing.stats.score.value };
          const player2 = { id: set.slots[1].standing.entrant.id, score: set.slots[1].standing.stats.score.value };
          const players = [player1, player2];
          return { round: set.round, players };
        }
      );
    const playersData = dataRequest?.data?.data?.tournament?.events?.[0].standings?.nodes;
    const players = playersData.map((player: any) => {
      return { id: player.entrant.id, place: player.placement };
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

export default { getBrackets, getInfo };
