import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type BlogDocument = Blog & Document;

@Schema({ timestamps: true })
export class Blog {
  @Prop({ required: true })
  title: string;

  @Prop()
  slug: string;

  @Prop()
  excerpt?: string;

  @Prop()
  content?: string;

  @Prop()
  thumbnail?: string;

  @Prop({ default: true })
  isPublished: boolean;

  @Prop({ default: 0 })
  order: number;
}

export const BlogSchema = SchemaFactory.createForClass(Blog);

BlogSchema.index({ slug: 1 }, { unique: true });
BlogSchema.index({ isPublished: 1 });
