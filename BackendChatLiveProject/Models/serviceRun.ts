import { type HydratedDocument, Schema, model } from "mongoose";

export interface IServiceRun {
  startedAt: Date;
  lastBeatAt: Date;
  environment: string;
  requests: number;
  latencyP50: number;
  createdAt: Date;
  updatedAt: Date;
}

export type ServiceRunDocument = HydratedDocument<IServiceRun>;

const serviceRunSchema = new Schema<IServiceRun>(
  {
    startedAt: { type: Date, required: true },
    lastBeatAt: { type: Date, required: true },
    environment: { type: String, default: "development" },
    requests: { type: Number, default: 0 },
    latencyP50: { type: Number, default: 0 },
  },
  { timestamps: true },
);

serviceRunSchema.index({ lastBeatAt: -1 });

export default model<IServiceRun>("ServiceRun", serviceRunSchema);
