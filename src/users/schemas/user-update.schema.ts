import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<UserUpdate>;

@Schema({ timestamps: true })
export class UserUpdate {

  @Prop({ type: String, required: true })
  keyApi: string;

  @Prop({ type: String, required: true })
  secret: string;
}

export const UserSchema = SchemaFactory.createForClass(UserUpdate);
