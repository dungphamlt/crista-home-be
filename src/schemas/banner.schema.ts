import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type BannerDocument = Banner & Document;

@Schema({ timestamps: true })
export class Banner {
  @Prop()
  title?: string;

  @Prop({ required: true })
  image: string;

  @Prop()
  link?: string;

  @Prop({ default: 0 })
  order: number;

  @Prop({ default: true })
  isActive: boolean;
}

export const BannerSchema = SchemaFactory.createForClass(Banner);
