import { getConnInfo } from "@hono/node-server/conninfo";
import { Hono } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import { adminAuthStore, type AdminAuthStore } from "@srouter/db";
import { err, ok } from "@/utils/response.js";
import {
    ADMIN_SESSION_COOKIE,
    ADMIN_SESSION_TTL_MS,
    createAdminSession,
    hashAdminPassword,
    isLoopbackAddress,
    revokeAdminSession,
    validateAdminPassword,
    verifyAdminPassword,
    verifyAdminSession,
} from "@/services/adminAuth.js";
import type { Context } from "hono";

const MAX_LOGIN_FAILURES = 5;
const LOGIN_BLOCK_MS = 15 * 60 * 1000;

interface AdminRequestBody {
    password?: unknown;
    confirmation?: unknown;
    setupToken?: unknown;
}

export interface AdminRouteOptions {
    store?: AdminAuthStore;
    getClientAddress?: (c: Context) => string | undefined;
    getSetupToken?: () => string | undefined;
    now?: () => number;
    secureCookies?: boolean;
}

function getDirectClientAddress(c: Context): string | undefined {
    try {
        return getConnInfo(c).remote.address ?? undefined;
    } catch {
        return undefined;
    }
}

async function readBody(c: Context): Promise<AdminRequestBody | null> {
    try {
        const body: unknown = await c.req.json();
        if (!body || typeof body !== "object" || Array.isArray(body)) return null;
        return body as AdminRequestBody;
    } catch {
        return null;
    }
}

function setAdminSessionCookie(c: Context, token: string, secure: boolean): void {
    setCookie(c, ADMIN_SESSION_COOKIE, token, {
        httpOnly: true,
        maxAge: Math.floor(ADMIN_SESSION_TTL_MS / 1000),
        path: "/",
        sameSite: "Lax",
        secure,
    });
}

function clearAdminSessionCookie(c: Context, secure: boolean): void {
    deleteCookie(c, ADMIN_SESSION_COOKIE, { path: "/", secure });
}

export function createAdminRoute(options: AdminRouteOptions = {}): Hono {
    const store = options.store ?? adminAuthStore;
    const getClientAddress = options.getClientAddress ?? getDirectClientAddress;
    const getSetupToken = options.getSetupToken ?? (() => process.env.SROUTER_SETUP_TOKEN);
    const now = options.now ?? (() => Date.now());
    const secureCookies = options.secureCookies ?? process.env.SROUTER_SECURE_COOKIES === "true";
    const failedLogins = new Map<string, { count: number; blockedUntil: number }>();
    const route = new Hono();

    route.get("/admin/status", (c) => {
        const authenticated = verifyAdminSession(store, getCookie(c, ADMIN_SESSION_COOKIE), now());
        return ok(c, { setupRequired: !store.hasAdminAccount(), authenticated });
    });

    route.post("/admin/setup", async (c) => {
        if (store.hasAdminAccount()) {
            return err(c, "Admin setup has already been completed", 409, {
                type: "authentication_error",
                code: "setup_already_complete",
            });
        }

        const body = await readBody(c);
        const passwordError = validateAdminPassword(body?.password);
        if (passwordError) {
            return err(c, passwordError, 400, {
                type: "invalid_request_error",
                code: "invalid_password",
            });
        }

        if (body?.confirmation !== body.password) {
            return err(c, "Password confirmation does not match", 400, {
                type: "invalid_request_error",
                code: "password_mismatch",
            });
        }

        const address = getClientAddress(c);
        const configuredSetupToken = getSetupToken();
        const hasValidSetupToken =
            Boolean(configuredSetupToken) && body?.setupToken === configuredSetupToken;
        if (!isLoopbackAddress(address) && !hasValidSetupToken) {
            return err(
                c,
                "Initial admin setup is only available from localhost or with a setup token",
                403,
                {
                    type: "authentication_error",
                    code: "setup_not_allowed",
                },
            );
        }

        const created = store.createAdminAccount(hashAdminPassword(body.password as string), now());
        if (!created) {
            return err(c, "Admin setup has already been completed", 409, {
                type: "authentication_error",
                code: "setup_already_complete",
            });
        }

        const sessionToken = createAdminSession(store, now());
        setAdminSessionCookie(c, sessionToken, secureCookies);
        return ok(c, { authenticated: true }, 201);
    });

    route.post("/admin/login", async (c) => {
        const address = getClientAddress(c) ?? "unknown";
        const timestamp = now();
        const failure = failedLogins.get(address);
        if (failure && failure.blockedUntil > timestamp) {
            return err(c, "Too many failed login attempts", 429, {
                type: "authentication_error",
                code: "login_rate_limited",
            });
        }
        if (failure && failure.blockedUntil > 0 && failure.blockedUntil <= timestamp) {
            failedLogins.delete(address);
        }

        const body = await readBody(c);
        const password = typeof body?.password === "string" ? body.password : "";
        const passwordHash = store.getPasswordHash();
        if (!passwordHash || !verifyAdminPassword(password, passwordHash)) {
            const current = failedLogins.get(address);
            const count = (current?.count ?? 0) + 1;
            failedLogins.set(address, {
                count,
                blockedUntil: count >= MAX_LOGIN_FAILURES ? timestamp + LOGIN_BLOCK_MS : 0,
            });
            return err(c, "Invalid admin password", 401, {
                type: "authentication_error",
                code: "invalid_credentials",
            });
        }

        failedLogins.delete(address);
        const sessionToken = createAdminSession(store, timestamp);
        setAdminSessionCookie(c, sessionToken, secureCookies);
        return ok(c, { authenticated: true });
    });

    route.post("/admin/logout", (c) => {
        const sessionToken = getCookie(c, ADMIN_SESSION_COOKIE);
        if (!verifyAdminSession(store, sessionToken, now())) {
            clearAdminSessionCookie(c, secureCookies);
            return err(c, "Admin authentication is required", 401, {
                type: "authentication_error",
                code: "authentication_required",
            });
        }

        revokeAdminSession(store, sessionToken);
        clearAdminSessionCookie(c, secureCookies);
        return c.body(null, 204);
    });

    return route;
}

export const adminRoute = createAdminRoute();
