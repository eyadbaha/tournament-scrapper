import express from "express";
import startgg from "../services/startgg.js";

const startggRouter = express.Router();
startggRouter.get("/brackets/:id", async (req, res, next) => {
  const eventId = req.params.id;
  try {
    const data = await startgg.getBrackets(eventId);
    res.json(data);
  } catch (err) {
    next(err);
  }
});
startggRouter.get("/info/:id", async (req, res, next) => {
  const eventId = req.params.id;
  try {
    const data = await startgg.getInfo(eventId);
    res.json(data);
  } catch (err) {
    next(err);
  }
});
startggRouter.get("/player/:id", async (req, res, next) => {
  const eventId = req.params.id;
  try {
    const data = await startgg.getPlayer(eventId);
    res.json(data);
  } catch (err) {
    next(err);
  }
});
export default startggRouter;
