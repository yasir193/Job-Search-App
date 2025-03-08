import { config } from "dotenv";
config();
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import cors from "cors";
import { database_connection } from "./DB/connection.js";
import authController from "./Modules/Auth/auth.controller.js";
import userController from "./Modules/user/user.controller.js";
import companyController from "./Modules/company/company.controller.js";
import jobController from "./Modules/job/job.controller.js";
import { createHandler } from "graphql-http/lib/use/express";
import { mainSchema } from "./GraphQl/main.schema.js";



export const bootstrap = () => {
  const app = express();
  app.use(express.json());
  app.use(helmet());
  app.use(cors({
    origin: "*", // Allow all origins
    methods: ['GET', 'POST', 'PUT', 'DELETE','PATCH'], // Specify allowed HTTP methods
    credentials: true // If you need cookies/authentication
  }));

  // const limiter = rateLimit({
  //   windowMs: 15 * 60 * 1000,
  //   max: 100,
  //   message: { message: "Too many requests, please try again later." },
  // });
  // app.use(limiter);

  app.use("/graphQl", createHandler({ schema: mainSchema }));
  app.use("/auth", authController);
  app.use("/user", userController);
  app.use("/company", companyController);
  app.use("/job", jobController);

  database_connection();

  app.get("/", async (req, res) => {
    res.json({ message: "Server is running!", data: await Status.findOne() });
  });

  app.listen(process.env.PORT || 3000, () => {
    console.log(`Server is running on port ${process.env.PORT}`);
  });
};
