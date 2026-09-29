import { Router } from "express";

import { getShowcase } from "../Controllers/showcaseController";

const showcaseRouter = Router();

showcaseRouter.get("/", getShowcase);

export default showcaseRouter;
