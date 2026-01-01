import { hash, verify } from "argon2";
import { Schema, model } from "mongoose";
import { IUser } from "../types/user";

const userSchema: Schema<IUser> = new Schema(
  {
    username: { type: String, required: true, unique: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

userSchema.pre<IUser>("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await hash(this.password);
});

userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  try {
    return await verify(this.password, candidatePassword);
  } catch (err) {
    return false;
  }
};

userSchema.index({ username: "text" });

const UserModel = model<IUser>("User", userSchema);

export default UserModel;
