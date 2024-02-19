import express from "express";
import tournamentModel from "../models/tournament.js";
import playerModel from "../models/player.js";
import startgg from "../services/startgg.js";
import tonamel from "../services/tonamel.js";

async function getPlayerIdsByTournamentSource() {
  try {
    const result = await tournamentModel.aggregate([
      {
        $match: {
          brackets: { $exists: true, $ne: [] }, // Matches tournaments with non-empty brackets array
        },
      },
      {
        $unwind: "$brackets",
      },
      {
        $unwind: "$brackets.players",
      },
      {
        $group: {
          _id: {
            tournamentUrl: "$url",
            playerId: "$brackets.players.id",
          },
        },
      },
      {
        $lookup: {
          from: "players", // Replace with the actual name of your "players" collection
          localField: "_id.playerId",
          foreignField: "id",
          as: "playerInfo",
        },
      },
      {
        $match: {
          playerInfo: { $eq: [] }, // Exclude documents with matching players
        },
      },
      {
        $project: {
          _id: 0,
          playerId: "$_id.playerId",
          startgg: {
            $cond: {
              if: { $regexMatch: { input: "$_id.tournamentUrl", regex: "start\\.gg" } },
              then: "$_id.playerId",
              else: null,
            },
          },
          tonamel: {
            $cond: {
              if: { $regexMatch: { input: "$_id.tournamentUrl", regex: "tonamel\\.com" } },
              then: "$_id.playerId",
              else: null,
            },
          },
        },
      },
      {
        $group: {
          _id: null,
          startgg: { $addToSet: "$startgg" },
          tonamel: { $addToSet: "$tonamel" },
        },
      },
      {
        $project: {
          _id: 0,
          startgg: {
            $filter: {
              input: "$startgg",
              cond: { $ne: ["$$this", null] },
            },
          },
          tonamel: {
            $filter: {
              input: "$tonamel",
              cond: { $ne: ["$$this", null] },
            },
          },
        },
      },
    ]);

    if (result.length > 0) {
      return {
        startgg: result[0].startgg,
        tonamel: result[0].tonamel,
      };
    } else {
      return {
        startgg: [],
        tonamel: [],
      };
    }
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
}

const update = async () => {
  const ids = await getPlayerIdsByTournamentSource();
  for (const id of ids.startgg) {
    const player = await playerModel.findOne({ id });
    if (!player) {
      try {
        const fetchedPlayer = await startgg.getPlayer(id);
        await playerModel.create(fetchedPlayer);
        console.log(fetchedPlayer);
      } catch (e) {
        console.log(e);
      }
    }
  }
  for (const id of ids.tonamel) {
    const player = await playerModel.findOne({ id });
    if (!player) {
      try {
        const fetchedPlayer = await tonamel.getPlayer(id);
        await playerModel.create(fetchedPlayer);
      } catch (e) {
        console.log(e);
      }
    }
  }
  console.log(ids);
};

const updatePlayersRouter = express.Router();
updatePlayersRouter.get("", async (req, res) => {
  const updates = await update();
  res.json(updates);
});

export { updatePlayersRouter };
