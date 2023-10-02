import express from "express";

const webhookRouter = express.Router();

webhookRouter.post("/", (req, res) => {
  res.status(200).send("RECIVED");
});

export default webhookRouter;
