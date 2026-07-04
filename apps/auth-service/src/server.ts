import dotenv from "dotenv";
import app from "./app.js";
dotenv.config();
const PORT = Number(process.env.PORT) || 4001;

app.listen(PORT, (): void => {
  console.log(`AUTH SERVER IS UP ON ${PORT}`);
});
