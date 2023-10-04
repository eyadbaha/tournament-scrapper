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
              name
              numAttendees
              rules
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
  const [title, date, details, game, participants] = [
    response.name,
    response.events[0].startAt * 1000,
    response.rules,
    response.events[0].videogame.name,
    response.numAttendees,
  ];
  const statusMap: { [key: string]: number } = { CREATED: 0, ACTIVE: 1, COMPLETED: 2 };
  const stateText = response.events[0].state as string;
  const state: number = statusMap[stateText] || -1;
  const data = { title, date, details, game, participants, state };
  const parsedData = infoDataSchema.parse(data);
  return parsedData;
};
const getBrackets = async (eventId: string) => {
  const info = await getInfo(eventId);
  if (info.state != 2) throw { status: 400, errorMessagege: "Tournament Results are not finalized" };
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
    const dataRequest = await axios.post(
      "https://api.start.gg/gql/alpha",
      {
        query: `query tournament($eventId: String!) {
                tournament(slug: $eventId) {
                  events (limit:1) {
                    phases(phaseId: ${phases[phases.length - 1].id}) {
                      sets(perPage: 200){
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
                  }
                }
              }`,
        variables: {
          eventId: eventId,
        },
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const data = dataRequest.data.data.tournament.events[0].phases[0].sets.nodes.map((set: any) => {
      const player1 = { id: set.slots[0].standing.entrant.id, score: set.slots[0].standing.stats.score.value };
      const player2 = { id: set.slots[1].standing.entrant.id, score: set.slots[1].standing.stats.score.value };
      const players = [player1, player2];
      return { round: set.round, players };
    });
    const parsedData = matchesDataSchema.parse(data);
    return parsedData;
  }
  throw { status: 500, errorMessagege: "Internal Server Error" };
};

export default { getBrackets, getInfo };
