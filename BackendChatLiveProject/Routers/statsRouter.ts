import { Router } from "express";

import { getStats } from "../Controllers/statsController";

const statsRouter = Router();

statsRouter.get("/", getStats);

export default statsRouter;
