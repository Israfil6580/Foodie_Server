const express = require("express");
const cors = require("cors");
const { CommandSucceededEvent, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 4000;
require("dotenv").config();
const { MongoClient, ServerApiVersion } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster3.cbcuonb.mongodb.net/?retryWrites=true&w=majority&appName=Cluster3`;
// jwt
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
// jwt end
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});
// middleware
const corsConfig = {
  origin: ["http://localhost:5173", "https://foddieapp.netlify.app"],
  credentials: true,
  optionSuccessStatus: 200,
};
app.use(cors(corsConfig));
app.use(express.json());
app.use(cookieParser());

const verifyToken = (req, res, next) => {
  const token = req.cookies?.token;
  if (!token) {
    return res.status(401).send({ messege: "unauthorized access by" });
  }
  if (token) {
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
      if (err) {
        console.log(err);
        return res.status(401).send({ messege: "unauthorized access by" });
      }
      req.user = decoded;
      next();
    });
  }
};

async function run() {
  const foodCollection = client.db("foddie").collection("food");
  // jwt generate
  app.post("/jwt", async (req, res) => {
    const user = req.body;
    const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
      expiresIn: "365d",
    });
    res
      .cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      })
      .send({ success: true });
  });

  // clear token on logout
  app.get("/logout", async (req, res) => {
    res
      .clearCookie("token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        maxAge: 0,
      })
      .send({ logout: true });
  });

  //
  try {
    // Define routes inside the try block
    app.get("/food", async (req, res) => {
      try {
        const result = await foodCollection.find().toArray();
        res.send(result);
      } catch (err) {
        console.error(err);
        res.status(500).send("Internal Server Error");
      }
    });

    app.post("/food", async (req, res) => {
      try {
        const addedFood = req.body;
        const result = await foodCollection.insertOne(addedFood);
        res.send(result);
      } catch (err) {
        console.error(err);
        res.status(500).send("Internal Server Error");
      }
    });

    app.get("/food/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await foodCollection.find(query).toArray();
        res.send(result);
      } catch (err) {
        console.error(err);
        res.status(500).send("Internal Server Error");
      }
    });

    app.put("/food/:id", async (req, res) => {
      try {
        const updateDocument = req.body;
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const options = { upsert: true };
        const updateDoc = {
          $set: {
            ...updateDocument,
          },
        };
        const result = await foodCollection.updateOne(
          query,
          updateDoc,
          options
        );
        res.send(result);
      } catch (err) {
        console.error(err);
        res.status(500).send("Internal Server Error");
      }
    });

    app.post("/food/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await foodCollection.deleteOne(query);
        res.send(result);
      } catch (err) {
        console.error(err);
        res.status(500).send("Internal Server Error");
      }
    });

    app.patch("/food/:id", async (req, res) => {
      try {
        const requestedDoc = req.body;
        const id = req.params.id;
        const options = { upsert: true };
        const filter = { _id: new ObjectId(id) };
        const updateDoc = {
          $set: { ...requestedDoc },
        };
        const result = await foodCollection.updateOne(
          filter,
          updateDoc,
          options
        );
        res.send(result);
      } catch (err) {
        console.error(err);
        res.status(500).send("Internal Server Error");
      }
    });
    app.get("/available-foods/:status", async (req, res) => {
      try {
        const foodStatus = req.params.status;
        const query = { foodStatus };
        const result = await foodCollection.find(query).toArray();
        res.send(result);
      } catch (err) {
        console.error(err);
        res.status(500).send("Internal Server Error requested food");
      }
    });
    app.get("/manage-foods/:email", verifyToken, async (req, res) => {
      try {
        const tokenData = req.user?.email;
        const donatorEmail = req.params.email;
        if (tokenData !== donatorEmail) {
          return res.status(403).send({ messege: "Forbidden Access By" });
        }
        const query = { donatorEmail };
        const result = await foodCollection.find(query).toArray();
        res.send(result);
      } catch (err) {
        console.error(err);
        res.status(500).send("Internal Server Error manage food");
      }
    });

    app.get("/requested-foods/:email", verifyToken, async (req, res) => {
      try {
        const tokenData = req.user?.email;
        const userEmail = req.params.email;
        if (tokenData !== userEmail) {
          return res.status(403).send({ messege: "Forbidden Access By" });
        }
        const query = { userEmail };
        const result = await foodCollection.find(query).toArray();
        res.send(result);
      } catch (err) {
        console.error(err);
        res.status(500).send("Internal Server Error requested food");
      }
    });
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  }

  app.get("/", async (req, res) => {
    res.send("hello bot");
  });

  app.listen(port, () => {
    console.log("Server is running on port", port);
  });
}

run().catch((error) => {
  console.error("Error starting server:", error);
});
