import assert from "node:assert/strict";
import test from "node:test";
import { openApiDocument } from "../src/openapi.js";

test("OpenAPI does not publish real login credentials", () => {
  const document = JSON.stringify(openApiDocument);

  assert.doesNotMatch(document, /@huuthanhco\.com/i);
  assert.doesNotMatch(document, /Admin@20\d{2}/i);
});

test("OpenAPI marks login passwords as write-only", () => {
  const loginRequest = openApiDocument.components.schemas.LoginRequest;

  assert.equal(loginRequest.properties.password.writeOnly, true);
  assert.equal(loginRequest.properties.password.format, "password");
});
