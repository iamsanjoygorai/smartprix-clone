import { describe, expect, it } from "vitest";

import {
  PERMISSIONS,
  ROLE_PERMISSIONS,
} from "./permissions";

describe("RBAC configuration", () => {
  it("should allow ADMIN to process Price Alerts", () => {
    expect(
      ROLE_PERMISSIONS.ADMIN,
    ).toContain(PERMISSIONS.PRICE_ALERTS_PROCESS);
  });

  it("should allow USER to change their own password", () => {
    expect(
      ROLE_PERMISSIONS.USER,
    ).toContain(PERMISSIONS.ACCOUNT_PASSWORD_CHANGE);
  });

  it("should allow EDITOR to change their own password", () => {
    expect(
      ROLE_PERMISSIONS.EDITOR,
    ).toContain(PERMISSIONS.ACCOUNT_PASSWORD_CHANGE);
  });

  it("should allow ADMIN to change their own password", () => {
    expect(
      ROLE_PERMISSIONS.ADMIN,
    ).toContain(PERMISSIONS.ACCOUNT_PASSWORD_CHANGE);
  });

  it("should not give ADMIN Admin Management permissions", () => {
    expect(
      ROLE_PERMISSIONS.ADMIN,
    ).not.toContain(PERMISSIONS.ADMINS_VIEW);

    expect(
      ROLE_PERMISSIONS.ADMIN,
    ).not.toContain(PERMISSIONS.ADMINS_CREATE);

    expect(
      ROLE_PERMISSIONS.ADMIN,
    ).not.toContain(PERMISSIONS.ADMINS_UPDATE);

    expect(
      ROLE_PERMISSIONS.ADMIN,
    ).not.toContain(PERMISSIONS.ADMINS_DELETE);
  });

  it("should give SUPER_ADMIN every permission", () => {
    expect(
      ROLE_PERMISSIONS.SUPER_ADMIN,
    ).toEqual(
      expect.arrayContaining(
        Object.values(PERMISSIONS),
      ),
    );
  });
});