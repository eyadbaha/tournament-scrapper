declare interface discordMessage {
  id: string;
  content: string;
  embeds: {
    description: string;
  }[];
}
type FacebookUser = {
  id: string;
  config: {
    language: string;
    following: string[];
  };
};
