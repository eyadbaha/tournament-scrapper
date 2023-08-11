import z from "zod";

const matchesData = z
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
export default matchesData;
