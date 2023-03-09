require("dotenv").config();

const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../app");

mongoose.set("strictQuery", false);

const { DB_HOST } = process.env;

describe("Test login controller", () => {
  beforeAll(() => {
    mongoose.connect(DB_HOST);
  });

  afterAll(() => {
    mongoose.disconnect(DB_HOST);
  });

  it("Return status 200 with correct data", async () => {
    const res = await request(app).get("/api/auth/login").send({
      email: "test@mail.com",
      password: "123456",
    });
    expect(res.status).toBe(200);
  });

  it("The response must contain a token", async () => {
    console.log("start test");
    const res = await request(app).get("/api/auth/login").send({
      email: "test@mail.com",
      password: "123456",
    });
    // console.log(res.body);
    expect(res.body.token).toBeDefined();
  });

  it("The response must contain a user object with 2 fields email and subscription, which have a String data type", async () => {
    const res = await request(app).get("/api/auth/login").send({
      email: "test@mail.com",
      password: "123456",
    });
    // console.log(res.body.user);
    expect(res.body.user).toHaveProperty("email");
    expect(res.body.user).toHaveProperty("subscription");
    expect(typeof res.body.user.email).toBe("string");
    expect(typeof res.body.user.subscription).toBe("string");
  });
});
