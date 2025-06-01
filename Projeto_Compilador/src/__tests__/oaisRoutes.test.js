require("dotenv").config({ path: ".env.test" });
const path = require("path");
const request = require("supertest");
const mongoose = require("mongoose");
const unzipper = require("unzipper");
const app = require("../app");
const Resource = require("../models/Resource");

describe("SIP Ingest & DIP Export", () => {
  let server, agent;

  beforeAll(async () => {
    const mongoUri =
      process.env.MONGO_URI || "mongodb://localhost:27017/eu-digital-test";
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    server = app.listen(0);
    const port = server.address().port;
    agent = request(`http://localhost:${port}`);
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    if (server) server.close();
  });

  it("should process a valid SIP zip and return 201 + sipId", async () => {
    const zipPath = path.join(__dirname, "fixtures", "test-sip.zip");

    const res = await agent.post("/api/ingest").attach("sip", zipPath);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("sipId");
    expect(res.body.resourcesCount).toBeGreaterThan(0);
  });

  it("should export those resources as a DIP zip with correct manifest", async () => {
    // 1. Get all resource IDs from the test DB
    const resources = await Resource.find().lean();
    expect(resources.length).toBeGreaterThan(0);
    const resourceIds = resources.map((r) => r._id.toString());

    // 2. Call the export endpoint
    const res2 = await agent
      .post("/api/disseminate")
      .send({ resourceIds })
      .set("Accept", "application/zip")
      .buffer(true) // tell Supertest to buffer the response
      .parse((res, callback) => {
        // collect chunks as binary
        const chunks = [];
        res.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
        res.on("end", () => callback(null, Buffer.concat(chunks)));
      });

    // 3. Basic HTTP assertions
    expect(res2.status).toBe(200);
    expect(res2.headers["content-type"]).toMatch(/zip/);

    // 4. Parse the ZIP in memory
    const zipBuffer = res2.body;
    const directory = await unzipper.Open.buffer(zipBuffer);

    // 5. Assert manifest exists
    const manifestFile = directory.files.find(
      (f) => f.path === "manifesto-DIP.json"
    );
    expect(manifestFile).toBeDefined();

    // 6. Read & parse manifest
    const manifestJson = JSON.parse((await manifestFile.buffer()).toString());
    expect(manifestJson).toHaveProperty("version", "0.97");
    expect(Array.isArray(manifestJson.payload)).toBe(true);
    expect(manifestJson.payload.length).toBe(resources.length);

    // 7. Check that each declared file actually exists in the ZIP
    for (let item of manifestJson.payload) {
      const found = directory.files.find((f) => f.path === item.filename);
      expect(found).toBeDefined();
      // and metadata entry
      const metaFound = directory.files.find(
        (f) => f.path === `metadata/${path.basename(item.filename)}.json`
      );
      expect(metaFound).toBeDefined();
    }
  });
});
