import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: String, required: true, unique: true })
  email: string;

  @Prop({ type: String, required: true })
  password: string;

  @Prop({ type: String, required: true })
  keyApi: string;

  @Prop({ type: String, required: true })
  secret: string;

  @Prop({ type: String})
  iv: string;
  
  @Prop({ type: String})
  salt: string;

  refresh_token?: string;

}

export const UserSchema = SchemaFactory.createForClass(User);
