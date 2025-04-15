import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

// Định nghĩa kiểu dữ liệu của tài liệu
export type EmaCrossHistoryDocument = HydratedDocument<EmaCrossHistory>;

@Schema()
export class EmaCrossHistory {
  @Prop({ type: String })
  cross: 'buy' | 'sell';

  @Prop({ type: Boolean })
  isTrading: boolean;

  @Prop({ type: Boolean })
  isActiveExecuteTrade: boolean;

  @Prop({ type: Boolean })
  isWaitingForCompletion: boolean;

  @Prop({ type: Number })
  tradeRate: number;

  @Prop({ type: Number })
  foldingCurrent: number;

  @Prop({ type: Number })
  largestMoney: number;
  
  @Prop({ type: String })
  time: string;

}

export const EmaCrossHistoryschema = SchemaFactory.createForClass(EmaCrossHistory);
