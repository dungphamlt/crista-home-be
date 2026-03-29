import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true })
  email: string;

  /** Bỏ qua khi đăng ký chỉ qua OAuth */
  @Prop({ required: false })
  password?: string;

  @Prop({ default: "user" })
  role: string;

  @Prop()
  name?: string;

  @Prop({ sparse: true, unique: true })
  googleId?: string;

  @Prop({ sparse: true, unique: true })
  facebookId?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
