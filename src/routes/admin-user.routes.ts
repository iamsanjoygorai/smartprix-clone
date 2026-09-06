import { Router } from "express";

import {
  getUsers,
  updateUser,
  disableUser,
  deleteUser,
} from "../controllers/admin-user.controller";

import { requirePermission } from "../middlewares/require-permission";
import { PERMISSIONS } from "../config/permissions";

const router = Router();

router.get(
  "/users",
  requirePermission(PERMISSIONS.USERS_VIEW),
  getUsers,
);

router.patch(
  "/users/:id",
  requirePermission(PERMISSIONS.USERS_UPDATE),
  updateUser,
);

router.patch(
  "/users/:id/disable",
  requirePermission(PERMISSIONS.USERS_DISABLE),
  disableUser,
);

router.delete(
  "/users/:id",
  requirePermission(PERMISSIONS.USERS_DELETE),
  deleteUser,
);

export default router;
