import { Router } from "express";

import {
  changePassword,
} from "../controllers/admin-account.controller";

const router = Router();

router.put("/password", changePassword);

export default router;
