import mongoose from "mongoose";
import { DataSchema } from "../schemas/infoData.js";

const tournamentSchema = new mongoose.Schema<DataSchema>({
  title: {
    type: String,
    required: true,
    min: 0,
  },
  date: {
    type: Number,
    required: true,
  },
  details: {
    type: String,
    required: false,
    min: 0,
  },
  game: {
    type: String,
    required: true,
  },
  participants: {
    type: Number,
    required: true,
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
    type: String || Number,
    required: false,
    min: 0,
  },
  url: {
    type: String,
    required: true,
    unique: true,
  },
  tags: {
    type: [String],
    required: true,
  },
  brackets: {
    type: {
      players: [
        {
          id: { type: String || Number, required: true },
          place: { type: Number, required: true },
          deckType: {
            type: String,
            required: false,
          },
          deck: {
            type: mongoose.Schema.Types.ObjectId,
            required: false,
          },
        },
      ],
      matches: [{ round: Number, players: [{ id: String || Number, score: Number }] }],
    },
  },
});

const tournamentModel = mongoose.model("tournament", tournamentSchema);

export default tournamentModel;
