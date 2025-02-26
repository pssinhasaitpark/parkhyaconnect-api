import express, { Request, Response } from "express";
import cors from "cors";
import userRoutes from "./app/routes/user";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/users", userRoutes);
app.get("/", (req: Request, res: Response) => {
  res.status(200).send({
    message: "Welcome to Parkhya Connect! ",
    error: false,
    status: 200,
  });
});

export default app;
