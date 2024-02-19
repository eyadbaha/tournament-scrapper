import mongoose from "mongoose";
import { PlayerSchema } from "../schemas/player.js";

const playerSchema = new mongoose.Schema<PlayerSchema>({
  id: {
    type: String,
    required: true,
    unique: true,
  },
  type: {
    type: String,
    enum: ["startgg", "tonamel"],
    required: true,
  },
  discordID: String,
  name: {
    type: String,
    default: "",
  },
});

const playerModel = mongoose.model("player", playerSchema);

export default playerModel;
