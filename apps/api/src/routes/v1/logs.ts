import { Hono } from 'hono';
import { getRecentLogsDB, getUsageSummaryDB } from '@srouter/db';

export const logsRoute = new Hono();

// GET /v1/logs - Get recent request logs
logsRoute.get('/logs', (c) => {
    const limitParam = c.req.query('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : 50;
    const logs = getRecentLogsDB(limit);

    return c.json({
        object: 'list',
        data: logs,
    });
});

// GET /v1/logs/stats - Get token usage summary & request count
logsRoute.get('/logs/stats', (c) => {
    const stats = getUsageSummaryDB();
    return c.json(stats);
});
