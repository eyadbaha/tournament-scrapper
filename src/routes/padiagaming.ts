import express from "express";
import padiaGaming from "../services/padiagaming.js";

const padiaGamingRouter = express.Router();
padiaGamingRouter.get("/info/:id", async (req, res, next) => {
  const id = req.params.id;
  try {
    const data = await padiaGaming.getInfo(id);
    res.json(data);
  } catch (err) {
    next(err);
  }
});
padiaGamingRouter.get("/brackets/:id", async (req, res, next) => {
  const id = req.params.id;
  try {
    const data = await padiaGaming.getBrackets(id);
    res.json(data);
  } catch (err) {
    next(err);
  }
});
export default padiaGamingRouter;
