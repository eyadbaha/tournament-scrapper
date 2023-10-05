import mongoose from "mongoose";

const channelSchema = new mongoose.Schema({
  id: {
    type: String,
    unique: true,
    required: true,
  },
  lastMessageId: {
    type: String,
    default: "",
  },
  name: {
    type: String,
    required: true,
    unique: true,
  },
});
channelSchema.set("validateBeforeSave", true);
const channelModel = mongoose.model("channel", channelSchema);

export default channelModel;
