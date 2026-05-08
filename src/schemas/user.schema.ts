import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ unique: true, sparse: true })
  email?: string;

  @Prop({ unique: true, sparse: true })
  username?: string;

  /** Bỏ qua khi đăng ký chỉ qua OAuth */
  @Prop({ required: false })
  password?: string;

  @Prop({ default: "user" })
  role: string;

  @Prop()
  name?: string;

  @Prop()
  avatar?: string;

  @Prop({ sparse: true, unique: true })
  googleId?: string;

  @Prop({ sparse: true, unique: true })
  facebookId?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
