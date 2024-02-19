import express from "express";
import tonamel from "../services/tonamel.js";
const tonamelRouter = express.Router();

tonamelRouter.get("/info/:id", async (req, res, next) => {
  const id = req.params.id;
  try {
    const data = await tonamel.getInfo(id);
    return res.json(data);
  } catch (err) {
    next(err);
  }
});

tonamelRouter.get("/brackets/:id", async (req, res, next) => {
  const id = req.params.id;
  try {
    const data = await tonamel.getBrackets(id);
    return res.json(data);
  } catch (err) {
    next(err);
  }
});
tonamelRouter.get("/player/:id", async (req, res, next) => {
  const id = req.params.id;
  try {
    const data = await tonamel.getPlayer(id);
    return res.json(data);
  } catch (err) {
    next(err);
  }
});
export default tonamelRouter;
