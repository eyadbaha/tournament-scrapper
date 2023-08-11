import z from "zod";
const dateSchema = z.union([z.string(), z.number()]);
type DateSchema = z.infer<typeof dateSchema>;

export default z.object({
  title: z.string().nonempty(),
  date: dateSchema,
  details: z.string().optional(),
  game: z.string().nonempty(),
  participants: z.number(),
  state: z.union([z.string().regex(/^\d+$/).transform(Number), z.number()]),
});
