import express from "express";
import paidiaGaming from "../services/paidiagaming.js";

const paidiaGamingRouter = express.Router();
paidiaGamingRouter.get("/info/:id", async (req, res, next) => {
  const id = req.params.id;
  try {
    const data = await paidiaGaming.getInfo(id);
    res.json(data);
  } catch (err) {
    next(err);
  }
});
paidiaGamingRouter.get("/brackets/:id", async (req, res, next) => {
  const id = req.params.id;
  try {
    const data = await paidiaGaming.getBrackets(id);
    res.json(data);
  } catch (err) {
    next(err);
  }
});
export default paidiaGamingRouter;
