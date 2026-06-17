const request = require("supertest");

describe("auth integration", () => {
  let app;

  beforeAll(() => {
    process.env.NODE_ENV = "test";
    process.env.JWT_SECRET = "test_secret";
    jest.resetModules();
    app = require("../server");
  });

  test("rejects /api/auth/me without token", async () => {
    const response = await request(app).get("/api/auth/me");

    expect(response.status).toBe(401);
  });
});
