import express from "express";
import startgg from "./routes/startgg";
import tonamel from "./routes/tonamel";

//bd7ea184d202fed6edbb7d21d7c87692
const app = express();
const port = 8080;

app.get("/", (req, res) => {
  res.send("v0");
});
app.use("/startgg/", startgg);
app.use("/tonamel", tonamel);

app.listen(process.env.PORT || port, () => {
  console.log(`Server started: http://localhost:${port}/`);
});
