import z from "zod";

export const validateRegistration = (data: any) => {
  const schema = z.object({
    username: z.string().min(3).max(30),
    email: z.email(),
    password: z.string().min(6).max(100),
  });

  return schema.safeParse(data);
};

export const validateLogin = (data: any) => {
  const schema = z.object({
    email: z.email(),
    password: z.string().min(6).max(100),
  });

  return schema.safeParse(data);
};
