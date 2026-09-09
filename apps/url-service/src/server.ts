import app from "./app.js";
import { env } from "./config/env.js";

const PORT = Number(env.PORT);
const startServer = async () => {
  try {
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Error starting server:", error);
  }
};

startServer();
