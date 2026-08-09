import { Hono } from 'hono';
import { registry } from '../../services/registry.js';
import type { ModelListResponse } from '@srouter/types';

export const modelsRoute = new Hono();

// GET /v1/models
modelsRoute.get('/models', async (c) => {
    const models = await registry.listAllModels();
    const response: ModelListResponse = {
        object: 'list',
        data: models,
    };
    return c.json(response);
});

// GET /v1/models/:model
modelsRoute.get('/models/:model', async (c) => {
    const modelId = c.req.param('model');
    const models = await registry.listAllModels();
    const model = models.find((m) => m.id === modelId);

    if (!model) {
        return c.json(
            {
                error: {
                    message: `Model '${modelId}' not found`,
                    type: 'invalid_request_error',
                    code: 'model_not_found',
                },
            },
            404
        );
    }

    return c.json(model);
});
