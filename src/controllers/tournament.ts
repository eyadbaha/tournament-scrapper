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
const getTournament = async (url: string): Promise<DataSchema | null> => {
  try {
    const tournament = await tournamentModel.findOne({ url: url }).lean();
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
const updateTournament = async (data: DataSchema): Promise<Boolean> => {
  try {
    const tournament = await tournamentModel.findOneAndUpdate({ url: data.url }, data, { runValidators: true });
    return true;
  } catch {
    return false;
  }
};
const tournamentController = { createTournament, getTournament, getAllTournaments, updateTournament };
export default tournamentController;
