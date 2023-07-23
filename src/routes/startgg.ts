import express from "express";
import axios from "axios";

const startggRouter = express.Router();
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
    { headers: { Authorization: "Bearer bd7ea184d202fed6edbb7d21d7c87692" } }
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
      { headers: { Authorization: "Bearer bd7ea184d202fed6edbb7d21d7c87692" } }
    );
    res.end(
      JSON.stringify(
        dataRequest.data.data.tournament.events[0].phases[0].sets.nodes.map(
          (set: any) => {
            const player1 = [
              set.slots[0].standing.entrant.id,
              set.slots[0].standing.stats.score.value,
            ];
            const player2 = [
              set.slots[1].standing.entrant.id,
              set.slots[1].standing.stats.score.value,
            ];
            return { round: set.round, player1, player2 };
          }
        )
      )
    );
  }
});
export default startggRouter;
