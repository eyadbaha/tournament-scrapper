import tournamentModel from "../models/tournament.js";
import { ObjectId } from "mongoose";
import { DataSchema } from "../schemas/infoData.js";

const createTournament = async (tournament: any) => {
  try {
    const newTournament = await tournamentModel.create(tournament);
    console.log(newTournament);
    return true;
  } catch (error) {
    console.log(error);
    return false;
  }
};
const getTournament = async (_id: ObjectId): Promise<DataSchema | null> => {
  try {
    const tournament = await tournamentModel.findById(_id).lean();
    return tournament || null;
  } catch {
    return null;
  }
};
const getAllTournaments = async (): Promise<DataSchema[] | null> => {
  try {
    const tournament = await tournamentModel.find({}).lean();
    return tournament;
  } catch {
    return null;
  }
};
const tournamentController = { createTournament, getTournament, getAllTournaments };
export default tournamentController;
