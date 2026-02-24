const request = require("supertest");
const app = require("../../src/app");
const User = require("../../src/models/User");

describe("Auth Controller", () => {
  describe("POST /api/auth/register", () => {
    it("should register a new user", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({
          name: "Test User",
          email: "test@example.com",
          password: "password123",
          role: "staff"
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user).toHaveProperty("email", "test@example.com");
    });

    it("should not register duplicate email", async () => {
      await User.create({
        name: "Existing",
        email: "duplicate@example.com",
        password: "password123",
        role: "staff"
      });

      const res = await request(app)
        .post("/api/auth/register")
        .send({
          name: "Test User",
          email: "duplicate@example.com",
          password: "password123"
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe("POST /api/auth/login", () => {
    it("should login with valid credentials", async () => {
      await request(app)
        .post("/api/auth/register")
        .send({
          name: "Login User",
          email: "login@example.com",
          password: "password123",
          role: "staff"
        });

      const res = await request(app)
        .post("/api/auth/login")
        .send({
          email: "login@example.com",
          password: "password123"
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body).toHaveProperty("token");
    });

    it("should not login with invalid credentials", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({
          email: "nonexistent@example.com",
          password: "wrongpassword"
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });
});