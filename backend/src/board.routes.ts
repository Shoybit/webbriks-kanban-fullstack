import { Router } from "express";
import { authenticate } from "./auth.middleware";
import {
  create,
  getAll,
  getOne,
  remove,
  update,
  addMember,
} from "./board.controller";const router = Router();

router.use(authenticate);

router.post("/", create);
router.get("/", getAll);
router.get("/:id", getOne);
router.put("/:id", update);
router.delete("/:id", remove);
router.post("/:id/members", addMember);

export default router;