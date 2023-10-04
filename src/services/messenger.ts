import axios from "axios";

const PAGE_ACCESS_TOKEN = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
const PAGE_ID = process.env.FACEBOOK_PAGE_ID; // Replace with your actual token
const callSendAPI = async (
  senderPSID: string,
  message: any,
  messaging_type: any = { messaging_type: "RESPONSE" }
): Promise<Boolean> => {
  try {
    const requestURL = `https://graph.facebook.com/v18.0/${PAGE_ID}/messages`;
    const params = {
      recipient: { id: senderPSID },
      message: message,
      ...messaging_type,
      access_token: PAGE_ACCESS_TOKEN,
    };
    await axios.post(requestURL, params, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    return true;
  } catch (error) {
    console.log(error);
    return false;
  }
};

export default { callSendAPI };
