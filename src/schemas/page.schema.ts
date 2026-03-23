import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PageDocument = Page & Document;

@Schema({ timestamps: true })
export class Page {
  @Prop({ required: true })
  name: string;

  @Prop()
  slug: string;

  @Prop({ default: '' })
  content: string;
}

export const PageSchema = SchemaFactory.createForClass(Page);

PageSchema.index({ slug: 1 }, { unique: true });
