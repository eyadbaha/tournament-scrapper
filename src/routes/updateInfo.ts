import express from "express";
import tournamentModel from "../models/tournament.js";
import tournamentScrape from "../services/tournamentScrape.js";

const update = async () => {
  let errCount = 0;
  try {
    const tournaments = await tournamentModel.find({
      state: { $ne: 2 },
      date: { $lt: Date.now() },
      // date: { $lt: Date.now() - 1000 * 60 * 60 * 24, $gt: Date.now() - 1000 * 60 * 60 * 24 * 30 },
    });
    if (tournaments.length) {
      const tournamentsUpdatedInfo: any[] = [];
      for (let tournament of tournaments.filter((tour) => {
        return !tour.url.includes("paidia");
      })) {
        try {
          const result = await tournamentScrape.getInfo(tournament.url);
          if (result) tournamentsUpdatedInfo.push(result);
          else {
            console.log("Retrying...");
            const result = await tournamentScrape.getInfo(tournament.url);
            if (result) tournamentsUpdatedInfo.push(result);
          }
        } catch (e: any) {
          console.log(`Error of tournament ${tournament.url}:${e}`);
          if (e.status == 404) {
            await tournamentModel.findOneAndDelete({ url: tournament.url });
          }
          errCount++;
        }
      }
      const finishedTournaments = tournamentsUpdatedInfo.filter(
        (e) => e?.state != -1 && e?.state != 0 && (e.date < Date.now() - 1000 * 60 * 60 * 12 || e.state == 2)
      );
      const unstartedTournaments = tournamentsUpdatedInfo.filter((e) => e?.state == -1 || e?.state == 0);
      for (let tournament of unstartedTournaments) {
        if (Date.now() - 24 * 60 * 60 * 1000 > tournament.date) {
          await tournamentModel.findOneAndDelete({ url: tournament.url });
        }
      }
      for (let tournament of finishedTournaments) {
        if (tournament) {
          try {
            const brackets = await tournamentScrape.getBrackets(tournament.url);
            if (brackets) {
              await tournamentModel.findOneAndUpdate(
                { url: tournament.url },
                { brackets, state: 2, participants: tournament.participants },
                { new: true }
              );
            } else {
              console.log("Retrying...");
              const brackets = await tournamentScrape.getBrackets(tournament.url);
              if (brackets) {
                await tournamentModel.findOneAndUpdate(
                  { url: tournament.url },
                  { brackets, state: 2, participants: tournament.participants },
                  { new: true }
                );
              } else {
                await tournamentModel.findOneAndDelete({ url: tournament.url });
              }
            }
          } catch (e) {
            console.log(`Error of tournament ${tournament.url}:${e}`);
            errCount++;
          }
        }
      }
      console.log(`Finished Updating Tournaments with ${errCount} Errors.`);
      return null;
    }
  } catch (e) {
    console.log(e);
  }
  return null;
};

const updateInfoRouter = express.Router();
updateInfoRouter.get("", async (req, res) => {
  const updates = await update();
  res.json(updates);
});

export { updateInfoRouter };
