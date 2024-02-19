import express from "express";
import paidiaGamingRouter from "./routes/paidiagaming.js";
import startgg from "./routes/startgg.js";
import tonamel from "./routes/tonamel.js";
import ErrorHandler from "./middlewares/errorHandler.js";
import { discordRouter } from "./routes/discord.js";
import db from "./config/database.js";
import webhookRouter from "./routes/webhook.js";
import { updateInfoRouter } from "./routes/updateInfo.js";
import { updatePlayersRouter } from "./routes/updatePlayers.js";

db;
const app = express();
const port = 8090;
app.use(express.json());
app.get("/", (req, res) => {
  res.status(200).send("v0");
});
app.use("/startgg", startgg);
app.use("/tonamel", tonamel);
app.use("/paidiagaming", paidiaGamingRouter);
app.use("/discord", discordRouter);
app.use("/webhook", webhookRouter);
app.use("/updateInfo", updateInfoRouter);
app.use("/updatePlayers", updatePlayersRouter);
app.use(ErrorHandler);
app.listen(process.env.PORT || port, () => {
  console.log(`Server started: http://localhost:${port}/`);
});
export default app;
