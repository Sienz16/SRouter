import assert from "node:assert/strict";
import { test } from "node:test";
import { getProviderAlias, ProviderRegistry } from "../src/registry.js";
import type { AIProvider } from "@srouter/types";

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
