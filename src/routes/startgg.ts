import express from "express";
import axios from "axios";

const startggRouter = express.Router();
const token = process.env.STARTGG_TOKEN;
startggRouter.get("/brackets/:id", async (req: any, res: any) => {
  const eventId = req.params.id;
  const phasesRequest: any = await axios.post(
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
  const phases = phasesRequest.data.data.tournament.events[0].phases;

  if (phases[phases.length - 1].bracketType == "SINGLE_ELIMINATION") {
    const dataRequest: any = await axios.post(
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
    res.end(
      JSON.stringify(
        dataRequest.data.data.tournament.events[0].phases[0].sets.nodes.map((set: any) => {
          const player1 = { id: set.slots[0].standing.entrant.id, score: set.slots[0].standing.stats.score.value };
          const player2 = { id: set.slots[1].standing.entrant.id, score: set.slots[1].standing.stats.score.value };
          const players = [player1, player2];
          return { round: set.round, players };
        })
      )
    );
  }
});
startggRouter.get("/info/:id", async (req: any, res: any) => {
  const eventId = req.params.id;
  const infoRequest: any = await axios.post(
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
  res.send(JSON.stringify({ title, date, details, game, participants, state }));
});
export default startggRouter;
