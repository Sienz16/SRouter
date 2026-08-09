import { createAPIKeyDB, deleteAPIKeyDB, getAllAPIKeysDB, type DBAPIKey } from "@srouter/db";
import type { CreateAPIKeyZod } from "@srouter/types";

export class KeysLogic {
    public static listAPIKeys(): DBAPIKey[] {
        return getAllAPIKeysDB();
    }

    public static generateAPIKey(data: CreateAPIKeyZod): DBAPIKey {
        return createAPIKeyDB(data);
    }

    public static removeAPIKey(id: string): boolean {
        return deleteAPIKeyDB(id);
    }
}
