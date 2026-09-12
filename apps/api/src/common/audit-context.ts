import type { Request } from "express";
import type { AuthUser } from "@nexahaus/types";
import type { AuditContext } from "../audit/audit.service";

/** Build the actor/request context attached to every audit-logged mutation. */
export function auditCtxFromRequest(req: Request, user: AuthUser): AuditContext {
  return {
    actorUserId: user.userId,
    actorRoleKey: user.roles[0] ?? null,
    ip: req.ip ?? null,
    userAgent: req.header("user-agent") ?? null,
    sessionId: user.sessionId,
    requestId: typeof req.id === "string" ? req.id : req.id != null ? String(req.id) : null,
  };
}
