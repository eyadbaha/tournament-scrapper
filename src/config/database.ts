import mongoose from "mongoose";

const DB_ENDPOINT =
  (process.env.NODE_ENV == "production" ? process.env.DB_ENDPOINT : process.env.DB_ENDPOINT_DEV) || "";
mongoose.connect(DB_ENDPOINT);
const db = mongoose.connection;

db.on("error", (error) => {
  console.error(error);
});

db.once("open", () => {
  console.log("Connected to the database.");
});

export default db;
