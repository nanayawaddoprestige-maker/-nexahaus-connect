import { RoleKey } from "@nexahaus/types";
import { AppError } from "../../common/app-error";
import { assertCanModifySuperAdmin, assertCanSetRole } from "./user-role.util";

describe("assertCanSetRole", () => {
  it("allows any staff role for a non-super-admin actor", () => {
    expect(() =>
      assertCanSetRole([RoleKey.PROPERTY_MANAGER], RoleKey.FINANCE_OFFICER),
    ).not.toThrow();
  });

  it("blocks a non-super-admin from granting SUPER_ADMIN", () => {
    expect(() =>
      assertCanSetRole([RoleKey.MANAGING_DIRECTOR], RoleKey.SUPER_ADMIN),
    ).toThrow(AppError);
  });

  it("allows a super-admin to grant SUPER_ADMIN", () => {
    expect(() =>
      assertCanSetRole([RoleKey.SUPER_ADMIN], RoleKey.SUPER_ADMIN),
    ).not.toThrow();
  });

  it("rejects a non-staff role regardless of actor", () => {
    expect(() =>
      assertCanSetRole([RoleKey.SUPER_ADMIN], RoleKey.OWNER),
    ).toThrow(AppError);
    expect(() =>
      assertCanSetRole([RoleKey.SUPER_ADMIN], RoleKey.TENANT),
    ).toThrow(AppError);
  });
});

describe("assertCanModifySuperAdmin", () => {
  it("allows modifying a non-super-admin target regardless of actor", () => {
    expect(() =>
      assertCanModifySuperAdmin([RoleKey.PROPERTY_MANAGER], false),
    ).not.toThrow();
  });

  it("blocks a non-super-admin from modifying a super-admin target", () => {
    expect(() =>
      assertCanModifySuperAdmin([RoleKey.MANAGING_DIRECTOR], true),
    ).toThrow(AppError);
  });

  it("allows a super-admin to modify a super-admin target", () => {
    expect(() =>
      assertCanModifySuperAdmin([RoleKey.SUPER_ADMIN], true),
    ).not.toThrow();
  });
});
