import mongoose from "mongoose";

import { env } from "./env";

async function connectDB(): Promise<typeof mongoose> {
  try {
    const connection = await mongoose.connect(env.DB_URI, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log(`MongoDB connecte : ${connection.connection.host}/${connection.connection.name}`);
    return connection;
  } catch (error) {
    console.error(
      "Connexion a MongoDB impossible :",
      error instanceof Error ? error.message : error,
    );
    process.exit(1);
  }
}

export default connectDB;
