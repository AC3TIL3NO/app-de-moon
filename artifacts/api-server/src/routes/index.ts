import { Router, type IRouter } from "express";
import healthRouter from "./health";
import instructorsRouter from "./instructors";
import clientsRouter from "./clients";
import classesRouter from "./classes";
import reservationsRouter from "./reservations";
import dashboardRouter from "./dashboard";
import membershipsRouter from "./memberships";
import notificationsRouter from "./notifications";
import paymentsRouter from "./payments";
import authRouter from "./auth";
import studioRouter from "./studio";
import reportsRouter from "./reports";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(studioRouter);
router.use(reportsRouter);
router.use(instructorsRouter);
router.use(clientsRouter);
router.use(classesRouter);
router.use(reservationsRouter);
router.use(dashboardRouter);
router.use(membershipsRouter);
router.use(notificationsRouter);
router.use(paymentsRouter);

export default router;
