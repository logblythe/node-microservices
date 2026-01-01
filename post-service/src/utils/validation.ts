import z from "zod";

export const validateCreatePost = (data: any) => {
  const schema = z.object({
    content: z.string().min(1, "Content cannot be empty"),
    mediaIds: z.array(z.string()).optional(),
  });
  return schema.safeParse(data);
};
