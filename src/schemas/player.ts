import z from "zod";

const playerSchema = z.object({
  id: z.string().min(0),
  type: z.literal("startgg").or(z.literal("tonamel")),
  discordID: z.string().min(0).nullable(),
  name: z.string().default(""),
});
export type PlayerSchema = z.infer<typeof playerSchema>;

export default playerSchema;
