require("dotenv").config({ path: ".env.test" });
const path = require("path");
const fs = require("fs-extra");
const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../app");

describe("Admin API: Users, News & Stats", () => {
  let server, agent;

  beforeAll(async () => {
    // connect to test DB
    const mongoUri = process.env.MONGO_URI;
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // start server
    server = app.listen(0);
    const port = server.address().port;
    agent = request(`http://localhost:${port}`);
  });

  afterAll(async () => {
    // clean DB and close
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    if (server) server.close();
    // clean logs
    await fs.emptyDir(path.join(__dirname, "..", "logs"));
  });

  //
  // === Users ===
  //
  describe("Users CRUD", () => {
    let userId;

    it("should create a user", async () => {
      const res = await agent
        .post("/api/admin/users")
        .send({
          username: "testuser",
          email: "test@example.com",
          passwordHash: "hashedpw",
          role: "user",
        })
        .set("Accept", "application/json");

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        username: "testuser",
        email: "test@example.com",
        role: "user",
      });
      userId = res.body._id;
    });

    it("should list users including the new one", async () => {
      const res = await agent.get("/api/admin/users");
      expect(res.status).toBe(200);
      const found = res.body.find((u) => u._id === userId);
      expect(found).toBeDefined();
    });

    it("should update the user role", async () => {
      const res = await agent
        .put(`/api/admin/users/${userId}`)
        .send({ role: "admin" });

      expect(res.status).toBe(200);
      expect(res.body.role).toBe("admin");
    });

    it("should delete the user", async () => {
      const res = await agent.delete(`/api/admin/users/${userId}`);
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ message: "Utilizador eliminado" });
    });

    it("should no longer find the deleted user", async () => {
      const res = await agent.get("/api/admin/users");
      expect(res.status).toBe(200);
      const found = res.body.find((u) => u._id === userId);
      expect(found).toBeUndefined();
    });
  });

  //
  // === News ===
  //
  describe("News CRUD & Visibility", () => {
    let newsId;

    it("should create a news item", async () => {
      const res = await agent
        .post("/api/admin/news")
        .send({ title: "Test News", content: "Lorem ipsum", visible: true });

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        title: "Test News",
        content: "Lorem ipsum",
        visible: true,
      });
      newsId = res.body._id;
    });

    it("should list news including the new one", async () => {
      const res = await agent.get("/api/admin/news");
      expect(res.status).toBe(200);
      const found = res.body.find((n) => n._id === newsId);
      expect(found).toBeDefined();
    });

    it("should update news content", async () => {
      const res = await agent
        .put(`/api/admin/news/${newsId}`)
        .send({ content: "Dolor sit amet" });

      expect(res.status).toBe(200);
      expect(res.body.content).toBe("Dolor sit amet");
    });

    it("should toggle visibility", async () => {
      // current visible=true
      const res1 = await agent.patch(`/api/admin/news/${newsId}/visibility`);
      expect(res1.status).toBe(200);
      expect(res1.body.visible).toBe(false);

      const res2 = await agent.patch(`/api/admin/news/${newsId}/visibility`);
      expect(res2.status).toBe(200);
      expect(res2.body.visible).toBe(true);
    });
  });

  //
  // === Stats ===
  //
  describe("Statistics endpoint", () => {
    const logsDir = path.join(__dirname, "..", "logs");
    const testLog = path.join(logsDir, "app-test.log");

    beforeAll(async () => {
      // seed a small log file with JSON lines
      await fs.ensureDir(logsDir);
      const lines = [
        JSON.stringify({
          level: "info",
          message: "Entrada SIP criada na BD: 1",
        }),
        JSON.stringify({ level: "info", message: "DIP exportado com sucesso" }),
        JSON.stringify({ level: "error", message: "Erro crítico" }),
        JSON.stringify({ level: "info", message: "Homepage viewed" }),
      ];
      await fs.emptyDir(logsDir);
      await fs.writeFile(testLog, lines.join("\n") + "\n");
    });

    it("should return usage statistics including our seeded events", async () => {
      const res = await agent.get("/api/admin/stats");
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("totalLogs", 4);
      expect(res.body).toHaveProperty("ingests", 1);
      expect(res.body).toHaveProperty("exports", 1);
      expect(res.body).toHaveProperty("errors", 1);
      expect(res.body).toHaveProperty("homeViews", 1);
    });
  });
});
