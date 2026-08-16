import { useState, type FormEvent, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface AdminStatus {
    setupRequired: boolean;
    authenticated: boolean;
    setupTokenConfigured: boolean;
    clientIsLoopback: boolean;
}

interface AdminAuthFormProps {
    setupRequired: boolean;
    setupTokenConfigured: boolean;
    clientIsLoopback: boolean;
    onAuthenticated: () => void;
}

function AdminAuthForm({
    setupRequired,
    setupTokenConfigured,
    clientIsLoopback,
    onAuthenticated
}: AdminAuthFormProps) {
    const [password, setPassword] = useState("");
    const [confirmation, setConfirmation] = useState("");
    const [setupToken, setSetupToken] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const remoteSetupLocked = setupRequired && !clientIsLoopback && !setupTokenConfigured;

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError(null);
        setIsSubmitting(true);

        try {
            await api.post<{ authenticated: boolean }>(
                setupRequired ? "/v1/admin/setup" : "/v1/admin/login",
                setupRequired
                    ? { password, confirmation, ...(setupToken ? { setupToken } : {}) }
                    : { password }
            );
            setPassword("");
            setConfirmation("");
            setSetupToken("");
            onAuthenticated();
        } catch (cause) {
            setError(cause instanceof ApiError ? cause.message : "Unable to authenticate");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <main className="flex min-h-svh items-center justify-center bg-background px-4 py-8">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                        SRouter control plane
                    </p>
                    <CardTitle>
                        {setupRequired ? "Create your admin password" : "Sign in to SRouter"}
                    </CardTitle>
                    <CardDescription>
                        {setupRequired
                            ? "This password protects provider credentials, API keys, and gateway settings."
                            : "Enter the admin password to open the gateway dashboard."}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
                        <label className="flex flex-col gap-1.5 text-xs font-medium">
                            Password
                            <Input
                                autoFocus
                                type="password"
                                autoComplete={setupRequired ? "new-password" : "current-password"}
                                value={password}
                                onChange={(event) => setPassword(event.target.value)}
                                placeholder={
                                    setupRequired ? "At least 12 characters" : "Admin password"
                                }
                                required
                            />
                        </label>

                        {setupRequired ? (
                            <>
                                <label className="flex flex-col gap-1.5 text-xs font-medium">
                                    Confirm password
                                    <Input
                                        type="password"
                                        autoComplete="new-password"
                                        value={confirmation}
                                        onChange={(event) => setConfirmation(event.target.value)}
                                        placeholder="Repeat the password"
                                        required
                                    />
                                </label>

                                {clientIsLoopback ? (
                                    <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-3 py-2 text-[11px] font-normal text-emerald-600 dark:text-emerald-400">
                                        You are on the server machine — no setup token needed.
                                    </p>
                                ) : remoteSetupLocked ? (
                                    <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-[11px] font-normal text-destructive">
                                        Remote setup is not enabled on this server. Ask your server
                                        administrator to configure the{" "}
                                        <code className="rounded bg-destructive/10 px-1 py-0.5 font-mono text-[10px]">
                                            SROUTER_SETUP_TOKEN
                                        </code>{" "}
                                        environment variable, or open SRouter from the server
                                        machine to finish setup.
                                    </p>
                                ) : (
                                    <>
                                        <label className="flex flex-col gap-1.5 text-xs font-medium">
                                            Setup token
                                            <Input
                                                type="password"
                                                autoComplete="off"
                                                value={setupToken}
                                                onChange={(event) =>
                                                    setSetupToken(event.target.value)
                                                }
                                                placeholder="Provided by your server administrator"
                                            />
                                            <span className="text-[11px] font-normal text-muted-foreground">
                                                This server requires a setup token for first-time
                                                setup from outside the server machine. Ask your
                                                server administrator for it.
                                            </span>
                                        </label>
                                    </>
                                )}
                            </>
                        ) : null}

                        {error ? (
                            <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                                {error}
                            </p>
                        ) : null}

                        <Button type="submit" disabled={isSubmitting} className="mt-1 w-full">
                            {isSubmitting
                                ? "Please wait…"
                                : setupRequired
                                  ? "Create password"
                                  : "Sign in"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </main>
    );
}

function AuthLoadingScreen() {
    return (
        <main className="flex min-h-svh items-center justify-center bg-background px-4">
            <p className="font-mono text-xs text-muted-foreground">Checking admin session…</p>
        </main>
    );
}

function AuthUnavailableScreen({ onRetry }: { onRetry: () => void }) {
    return (
        <main className="flex min-h-svh items-center justify-center bg-background px-4 py-8">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Gateway unavailable</CardTitle>
                    <CardDescription>
                        SRouter could not verify the admin session. Make sure the API is running and
                        try again.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button type="button" variant="outline" onClick={onRetry} className="w-full">
                        Try again
                    </Button>
                </CardContent>
            </Card>
        </main>
    );
}

export function AdminAuthGate({ children }: { children: ReactNode }) {
    const statusQuery = useQuery({
        queryKey: ["admin-auth-status"],
        queryFn: () => api.get<AdminStatus>("/v1/admin/status"),
        retry: false,
        staleTime: 0
    });

    if (statusQuery.isPending) return <AuthLoadingScreen />;
    if (statusQuery.isError || !statusQuery.data) {
        return <AuthUnavailableScreen onRetry={() => void statusQuery.refetch()} />;
    }
    if (!statusQuery.data.authenticated) {
        return (
            <AdminAuthForm
                setupRequired={statusQuery.data.setupRequired}
                setupTokenConfigured={statusQuery.data.setupTokenConfigured}
                clientIsLoopback={statusQuery.data.clientIsLoopback}
                onAuthenticated={() => void statusQuery.refetch()}
            />
        );
    }

    return <>{children}</>;
}
