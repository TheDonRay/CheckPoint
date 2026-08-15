import mongoose from "mongoose";

const dbConnection = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error(
      "MONGODB_URI is not set. Add it to backend/.env before starting the app.",
    );
  }

  try {
    await mongoose.connect(uri);
    console.log("Connected to database Successfully");
  } catch (error) {
    console.error(`Database connection error: ${error.message}`);
    throw error;
  }
};

const dbDisconnect = async () => {
  await mongoose.disconnect();
  console.log("Disconnected from database");
};

export { dbConnection, dbDisconnect };
