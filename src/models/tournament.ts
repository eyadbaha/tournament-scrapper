import mongoose from "mongoose";

const tournamentSchema = new mongoose.Schema({
  site: String,
  id: String,
  date: Date,
  tags: [String],
  game: String,
  participants: {
    type: Number,
    required: false,
    min: 0,
  },
  state: {
    type: Number,
    default: 0,
  },
  limit: {
    type: Number,
    required: false,
  },
  organizer: {
    type: Number,
    required: false,
    min: 0,
  },
  title: String,
  details: {
    type: String,
    required: false,
    min: 0,
  },
});

const tournamentModel = mongoose.model("tournament", tournamentSchema);

export default tournamentModel;
