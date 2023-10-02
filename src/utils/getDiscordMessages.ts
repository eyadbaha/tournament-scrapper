import axios from "axios";

const token = process.env.DISCORD_TOKEN;
const getDiscordMessages = async (channelID: string, limit: Number = 1) => {
  try {
    if (!token || !/^\d+$/.test(channelID)) console.log(token, channelID);
    const apiURL = `https://discord.com/api/v9/channels/${channelID}/messages?limit=${limit}`;
    const headers = { Authorization: token };
    const instance = axios.create({
      baseURL: apiURL,
      headers,
    });
    const response = await instance.get(apiURL, { headers });
    return response.data;
  } catch (err) {
    console.log(err);
    return null;
  }
};

export { getDiscordMessages };
