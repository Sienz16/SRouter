import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import {
    createAPIKeyDB,
    deleteAPIKeyDB,
    getAllAPIKeysDB,
    getAPIKeyByKeyDB,
    incrementAPIKeyUsageDB,
} from "@srouter/db";

const createdIds: string[] = [];

afterEach(() => {
    for (const id of createdIds.splice(0)) {
        deleteAPIKeyDB(id);
    }
});

test("createAPIKeyDB stores a new virtual key with prefix sr-live-", () => {
    const created = createAPIKeyDB({
        name: "Test Client Key",
        rateLimit: 60,
        quotaLimit: 50000,
    });

    createdIds.push(created.id);

    assert.ok(created.id.startsWith("key_"));
    assert.ok(created.key.startsWith("sr-live-"));
    assert.equal(created.name, "Test Client Key");
    assert.equal(created.enabled, true);
    assert.equal(created.rateLimit, 60);
    assert.equal(created.quotaLimit, 50000);
    assert.equal(created.usageTokens, 0);

    const lookup = getAPIKeyByKeyDB(created.key);
    assert.ok(lookup);
    assert.equal(lookup?.id, created.id);
    assert.equal(lookup?.name, "Test Client Key");
});

test("incrementAPIKeyUsageDB and deleteAPIKeyDB work accurately", () => {
    const created = createAPIKeyDB({
        name: "Usage Test Key",
    });

    createdIds.push(created.id);

    incrementAPIKeyUsageDB(created.id, 1250);

    const all = getAllAPIKeysDB();
    const found = all.find((k) => k.id === created.id);
    assert.equal(found?.usageTokens, 1250);

    const deleted = deleteAPIKeyDB(created.id);
    assert.equal(deleted, true);

    const lookupAfterDelete = getAPIKeyByKeyDB(created.key);
    assert.equal(lookupAfterDelete, null);
});
