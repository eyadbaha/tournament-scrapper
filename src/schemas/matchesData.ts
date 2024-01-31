import z from "zod";

const matches = z
  .array(
    z.object({
      round: z.number(),
      players: z.array(
        z.object({
          id: z.union([z.string(), z.number()]),
          score: z.union([z.string().regex(/^\d+$/).transform(Number), z.number()]),
        })
      ),
    })
  )
  .min(1);
const players = z.array(
  z
    .object({
      id: z.union([z.string(), z.number()]),
      place: z.number(),
    })
    .nullable()
);
const matchesData = z.object({
  players: players,
  matches: matches,
});
export type MatchesSchema = z.infer<typeof matchesData>;
export default matchesData;
