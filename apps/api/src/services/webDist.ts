import fs from "node:fs";
import path from "node:path";

function dashboardDistCandidates(cwd: string): string[] {
    const candidates: string[] = [];
    let current = path.resolve(cwd);

    while (true) {
        candidates.push(path.join(current, "apps/web/dist"));
        const parent = path.dirname(current);
        if (parent === current) break;
        current = parent;
    }

    return candidates;
}

export function resolveWebDistPath(
    cwd = process.cwd(),
    configuredPath = process.env.WEB_DIST_PATH
): string {
    if (configuredPath) return path.resolve(cwd, configuredPath);

    return (
        dashboardDistCandidates(cwd).find((candidate) =>
            fs.existsSync(path.join(candidate, "index.html"))
        ) ?? dashboardDistCandidates(cwd)[0]!
    );
}
