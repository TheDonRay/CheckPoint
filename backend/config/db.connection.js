import mongoose from "mongoose";

const dbConnection = async () => {
  try {
    const validConnection = mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to database Successfully");
  } catch (error) {
    console.error(`Database connection error: ${error.message}`);
    process.exit(1); // Exit process with failure
  }
};

export { dbConnection };
