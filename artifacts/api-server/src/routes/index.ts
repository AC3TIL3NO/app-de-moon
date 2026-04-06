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

const router: IRouter = Router();

router.use(healthRouter);
router.use(instructorsRouter);
router.use(clientsRouter);
router.use(classesRouter);
router.use(reservationsRouter);
router.use(dashboardRouter);
router.use(membershipsRouter);
router.use(notificationsRouter);
router.use(paymentsRouter);

export default router;
