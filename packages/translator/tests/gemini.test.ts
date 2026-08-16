import assert from "node:assert/strict";
import { test } from "node:test";
import { buildAntigravityContents } from "../src/gemini.js";
import type { ChatCompletionRequest } from "@srouter/types";

test("buildAntigravityContents produces valid parts without empty text in oneof functionCall / functionResponse", () => {
    const req: ChatCompletionRequest = {
        model: "antigravity/gemini-2.5-pro",
        messages: [
            { role: "user", content: "What is the weather in Tokyo?" },
            {
                role: "assistant",
                content: null,
                tool_calls: [
                    {
                        id: "call_weather_1",
                        type: "function",
                        function: {
                            name: "get_weather",
                            arguments: JSON.stringify({ location: "Tokyo" })
                        }
                    }
                ]
            },
            {
                role: "tool",
                tool_call_id: "call_weather_1",
                content: JSON.stringify({ temperature: "22C", condition: "Sunny" })
            }
        ]
    };

    const contents = buildAntigravityContents(req);
    assert.equal(contents.length, 3);

    // 1. User message
    assert.equal(contents[0]?.role, "user");
    assert.equal(contents[0]?.parts[0]?.text, "What is the weather in Tokyo?");

    // 2. Assistant message with functionCall
    assert.equal(contents[1]?.role, "model");
    const modelPart = contents[1]?.parts[0];
    assert.ok(modelPart?.functionCall);
    assert.equal(modelPart.functionCall.name, "get_weather");
    assert.deepEqual(modelPart.functionCall.args, { location: "Tokyo" });
    // Verify text is undefined (not empty string) to satisfy protobuf oneof constraint
    assert.equal(modelPart.text, undefined);
    assert.equal(Object.prototype.hasOwnProperty.call(modelPart, "text"), false);

    // 3. Tool response message with functionResponse
    assert.equal(contents[2]?.role, "user");
    const toolPart = contents[2]?.parts[0];
    assert.ok(toolPart?.functionResponse);
    assert.equal(toolPart.functionResponse.name, "get_weather");
    assert.deepEqual(toolPart.functionResponse.response, {
        temperature: "22C",
        condition: "Sunny"
    });
    // Verify text is undefined (not empty string) to satisfy protobuf oneof constraint
    assert.equal(toolPart.text, undefined);
    assert.equal(Object.prototype.hasOwnProperty.call(toolPart, "text"), false);
});
