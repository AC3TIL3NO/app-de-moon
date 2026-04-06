import { Router, type IRouter } from "express";
import healthRouter from "./health";
import instructorsRouter from "./instructors";
import clientsRouter from "./clients";
import classesRouter from "./classes";
import reservationsRouter from "./reservations";
import dashboardRouter from "./dashboard";
import membershipsRouter from "./memberships";

const router: IRouter = Router();

router.use(healthRouter);
router.use(instructorsRouter);
router.use(clientsRouter);
router.use(classesRouter);
router.use(reservationsRouter);
router.use(dashboardRouter);
router.use(membershipsRouter);

export default router;
