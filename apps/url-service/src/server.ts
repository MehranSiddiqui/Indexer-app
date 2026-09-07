import dotenv from "dotenv";
dotenv.config();

import app from "./app.js";
const PORT = Number(process.env.PORT) || 4002;
const startServer = async () => {
  try {
    // await connectRedis();
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Error starting server:", error);
  }
};

startServer();
