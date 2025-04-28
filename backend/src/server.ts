import dotenv from "dotenv";
dotenv.config();

import express, { Express } from "express";
import cors from "cors";
import { connectDatabase } from "./providers/connectDB.provider";
import { productRouter } from "./routes/product.route";
import { errorMiddleware } from "./middlewares/error.middleware";
import { fileRouter } from "./routes/file.route";

const app: Express = express();

connectDatabase();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(errorMiddleware);

app.get("/", (req, res) => {
    res.send("Hello World");
});

app.use("/api/v1/products", productRouter);
app.use("/api/v1/files", fileRouter);

app.listen(3000, () => {
    console.log("Server is running on port 3000");
});
