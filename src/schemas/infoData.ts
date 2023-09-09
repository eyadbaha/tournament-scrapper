import z from "zod";
const dateSchema = z.union([z.string(), z.number()]);
type DateSchema = z.infer<typeof dateSchema>;

const schema = z.object({
  title: z.string().nonempty(),
  date: dateSchema,
  details: z.string().optional(),
  game: z.string().nonempty(),
  participants: z.number(),
  state: z.union([z.string().regex(/^\d+$/).transform(Number), z.number()]),
  limit: z.number().optional(),
  organizer: z.string().nonempty().optional(),
});
const infoDataSchema = schema.transform((obj) => {
  if (typeof obj.limit !== "number") delete obj.limit;
  return obj;
});

export default infoDataSchema;
