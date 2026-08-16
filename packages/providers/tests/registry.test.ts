import assert from "node:assert/strict";
import { test } from "node:test";
import { getProviderAlias, ProviderRegistry } from "../src/registry.js";
import type { AIProvider } from "@srouter/types";

const delay = (ms: number): Promise<void> =>
    new Promise((resolve) => {
        setTimeout(resolve, ms);
    });

const provider: AIProvider = {
    id: "kiro_test_runtime",
    name: "Kiro Runtime Test",
    listModels: async () => [],
    chatCompletion: async () => {
        throw new Error("not used");
    },
    chatCompletionStream: async function* () {
        throw new Error("not used");
    }
};

test("unregisterProvider removes a deleted runtime connection", () => {
    const registry = new ProviderRegistry();
    registry.registerProvider(provider);
    assert.equal(registry.getProvider(provider.id), provider);

    assert.equal(registry.unregisterProvider(provider.id), true);
    assert.equal(registry.getProvider(provider.id), undefined);
    assert.equal(registry.unregisterProvider(provider.id), false);
});

test("Neosantara uses its own model prefix alias", () => {
    assert.equal(getProviderAlias("neosantara"), "neosantara");
    assert.equal(getProviderAlias("neosantara_123"), "neosantara");
});

test("GoRouter uses its own model prefix alias", () => {
    assert.equal(getProviderAlias("gorouter"), "gorouter");
    assert.equal(getProviderAlias("gorouter_123"), "gorouter");
});

test("BluesMinds uses its own model prefix alias", () => {
    assert.equal(getProviderAlias("bluesminds"), "bluesminds");
    assert.equal(getProviderAlias("bluesminds_123"), "bluesminds");
});

test("SeekAI uses its own model prefix alias", () => {
    assert.equal(getProviderAlias("seekai"), "seekai");
    assert.equal(getProviderAlias("seekai_123"), "seekai");
});

test("TabiToken uses its own model prefix alias", () => {
    assert.equal(getProviderAlias("tabitoken"), "tabitoken");
    assert.equal(getProviderAlias("tabitoken_123"), "tabitoken");
});

test("Qoder uses qd model prefix alias", () => {
    assert.equal(getProviderAlias("qoder"), "qd");
    assert.equal(getProviderAlias("qoder_456"), "qd");
});

test("getProviderForModel resolves provider with alias and full name prefixes", async () => {
    const registry = new ProviderRegistry();
    const qoderProvider: AIProvider = {
        id: "qoder_1786759000",
        name: "Qoder Test",
        listModels: async () => [{ id: "qoder/ultimate", object: "model" }],
        chatCompletion: async () => {
            throw new Error("not used");
        },
        chatCompletionStream: async function* () {
            throw new Error("not used");
        }
    };
    registry.registerProvider(qoderProvider);

    // Direct model match
    const p1 = await registry.getProviderForModel("qoder/ultimate");
    assert.equal(p1.id, qoderProvider.id);

    // Alias prefix match (qd/ultimate)
    const p2 = await registry.getProviderForModel("qd/ultimate");
    assert.equal(p2.id, qoderProvider.id);

    // Unregistered provider throws descriptive error
    await assert.rejects(
        () => registry.getProviderForModel("unregistered/model"),
        /No active provider connection found for model "unregistered\/model"/
    );
});

test("ProviderRegistry caches listModels responses across multiple calls within TTL", async () => {
    let callCount = 0;
    const testProvider: AIProvider = {
        id: "test_cached_provider",
        name: "Test Cached Provider",
        listModels: async () => {
            callCount++;
            return [{ id: "test_cached_provider/model-1", object: "model" }];
        },
        chatCompletion: async () => {
            throw new Error("not used");
        },
        chatCompletionStream: async function* () {
            throw new Error("not used");
        }
    };

    const registry = new ProviderRegistry();
    registry.registerProvider(testProvider);

    // Initial call fetches models
    const models1 = await registry.listAllModels();
    assert.equal(callCount, 1);
    assert.equal(models1.length, 1);
    assert.equal(models1[0]?.id, "test/model-1");

    // Second call within TTL hits cache (callCount remains 1)
    const models2 = await registry.listAllModels();
    assert.equal(callCount, 1);
    assert.deepEqual(models2, models1);

    // forceRefresh bypasses cache (callCount increments)
    const models3 = await registry.listAllModels(undefined, true);
    assert.equal(callCount, 2);
    assert.deepEqual(models3, models1);
});

test("ProviderRegistry invalidates cache on register and unregister", async () => {
    let callCount = 0;
    const testProvider: AIProvider = {
        id: "test_invalidation_provider",
        name: "Test Invalidation Provider",
        listModels: async () => {
            callCount++;
            return [{ id: "test_invalidation_provider/alpha", object: "model" }];
        },
        chatCompletion: async () => {
            throw new Error("not used");
        },
        chatCompletionStream: async function* () {
            throw new Error("not used");
        }
    };

    const registry = new ProviderRegistry();
    registry.registerProvider(testProvider);

    await registry.listAllModels();
    assert.equal(callCount, 1);

    // Re-registering the provider clears cache
    registry.registerProvider(testProvider);
    await registry.listAllModels();
    assert.equal(callCount, 2);

    // Unregistering removes provider and clears cache
    registry.unregisterProvider(testProvider.id);
    const models = await registry.listAllModels();
    assert.equal(models.length, 0);
});

test("ProviderRegistry serves a stale aggregate snapshot while refreshing", async () => {
    let callCount = 0;
    const testProvider: AIProvider = {
        id: "test_snapshot_provider",
        name: "Test Snapshot Provider",
        listModels: async () => {
            callCount++;
            if (callCount === 2) await delay(120);
            return [
                {
                    id: `test_snapshot_provider/${callCount === 1 ? "stale" : "fresh"}`,
                    object: "model"
                }
            ];
        },
        chatCompletion: async () => {
            throw new Error("not used");
        },
        chatCompletionStream: async function* () {
            throw new Error("not used");
        }
    };

    const registry = new ProviderRegistry(undefined, 100);
    registry.registerProvider(testProvider);
    await registry.listAllModels();
    await delay(110);

    const startedAt = Date.now();
    const staleModels = await registry.listAllModels();
    const elapsedMs = Date.now() - startedAt;

    assert.ok(elapsedMs < 60, `stale read took ${elapsedMs}ms`);
    assert.equal(staleModels[0]?.id, "test/stale");
    assert.equal(callCount, 2);

    await delay(140);
    const freshModels = await registry.listAllModels();
    assert.equal(freshModels[0]?.id, "test/fresh");
    assert.equal(callCount, 2);
});

test("ProviderRegistry bounds slow refreshes and keeps cached models", async () => {
    let callCount = 0;
    const testProvider: AIProvider = {
        id: "test_timeout_provider",
        name: "Test Timeout Provider",
        listModels: async () => {
            callCount++;
            if (callCount > 1) await delay(300);
            return [
                {
                    id: `test_timeout_provider/${callCount === 1 ? "cached" : "fresh"}`,
                    object: "model"
                }
            ];
        },
        chatCompletion: async () => {
            throw new Error("not used");
        },
        chatCompletionStream: async function* () {
            throw new Error("not used");
        }
    };

    const registry = new ProviderRegistry();
    registry.registerProvider(testProvider);
    await registry.listAllModels();
    registry.setModelsFetchTimeoutMs(20);

    const startedAt = Date.now();
    const models = await registry.listAllModels(undefined, true);
    const elapsedMs = Date.now() - startedAt;

    assert.ok(elapsedMs < 150, `timed out read took ${elapsedMs}ms`);
    assert.equal(models[0]?.id, "test/cached");
    assert.equal(callCount, 2);
});

test("ProviderRegistry coalesces concurrent forced refreshes", async () => {
    let callCount = 0;
    const pending: Array<() => void> = [];
    const testProvider: AIProvider = {
        id: "test_forced_refresh_provider",
        name: "Test Forced Refresh Provider",
        listModels: async () => {
            callCount++;
            if (callCount > 1) {
                await new Promise<void>((resolve) => {
                    pending.push(resolve);
                });
            }
            return [{ id: "test_forced_refresh_provider/model", object: "model" }];
        },
        chatCompletion: async () => {
            throw new Error("not used");
        },
        chatCompletionStream: async function* () {
            throw new Error("not used");
        }
    };

    const registry = new ProviderRegistry();
    registry.registerProvider(testProvider);
    await registry.listAllModels();

    const firstRefresh = registry.listAllModels(undefined, true);
    const secondRefresh = registry.listAllModels(undefined, true);
    await delay(10);

    assert.equal(callCount, 2);
    pending.forEach((resolve) => resolve());
    await Promise.all([firstRefresh, secondRefresh]);
    assert.equal(callCount, 2);
});
