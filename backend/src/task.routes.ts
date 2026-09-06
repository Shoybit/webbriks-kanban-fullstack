import { Router } from "express";
import { authenticate } from "./auth.middleware";
import { create, getAll, update, remove, move } from "./task.controller";
const router = Router();

router.use(authenticate);

router.post("/:columnId", create);
router.get("/:columnId", getAll);
router.put("/:taskId", update);
router.delete("/:taskId", remove);
router.patch("/:taskId/move", move);

export default router;