import express from "express";
import startgg from "./routes/startgg.js";
import tonamel from "./routes/tonamel.js";

const app = express();
const port = 8090;

app.get("/", (req, res) => {
  res.send("v0");
});
app.use("/startgg", startgg);
app.use("/tonamel", tonamel);

app.listen(process.env.PORT || port, () => {
  console.log(`Server started: http://localhost:${port}/`);
});
export default app;
