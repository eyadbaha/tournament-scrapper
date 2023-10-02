import express from "express";
import padiaGamingRouter from "./routes/padiagaming.js";
import startgg from "./routes/startgg.js";
import tonamel from "./routes/tonamel.js";
import ErrorHandler from "./middlewares/errorHandler.js";
import { discordRouter } from "./routes/discord.js";
import db from "./config/database.js";

db;
const app = express();
const port = 8090;
app.use(express.json());
app.get("/", (req, res) => {
  res.status(200).send("v0");
});
app.use("/startgg", startgg);
app.use("/tonamel", tonamel);
app.use("/padiagaming", padiaGamingRouter);
app.use("/discord", discordRouter);
app.use(ErrorHandler);
app.listen(process.env.PORT || port, () => {
  console.log(`Server started: http://localhost:${port}/`);
});
export default app;
