import z from "zod";

const schema = z.object({
  title: z.string().nonempty(),
  date: z.number(),
  details: z.string().optional(),
  game: z.string().nonempty(),
  participants: z.number(),
  state: z.union([z.string().regex(/^\d+$/).transform(Number), z.number()]),
  limit: z.number().optional(),
  organizer: z.string().nonempty().optional(),
  url: z.string().nonempty(),
  tags: z.array(z.string()),
});
const infoDataSchema = schema.transform((obj) => {
  if (typeof obj.limit !== "number") delete obj.limit;
  return obj;
});
export type DataSchema = z.infer<typeof infoDataSchema>;

export default infoDataSchema;
