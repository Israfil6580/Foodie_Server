const express = require("express");
const cors = require("cors");
const { CommandSucceededEvent, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 4000;
require("dotenv").config();
const { MongoClient, ServerApiVersion } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster3.cbcuonb.mongodb.net/?retryWrites=true&w=majority&appName=Cluster3`;

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

async function run() {
  const foodCollection = client.db("foddie").collection("food");
  const foodRequestCollection = client.db("foddie").collection("foodRequest");
  try {
    app.get("/food", async (req, res) => {
      try {
        const result = await foodCollection.find().toArray();
        res.send(result);
      } catch (err) {
        res.send(err);
      }
    });

    app.post("/food", async (req, res) => {
      try {
        const addedFood = req.body;
        const result = await foodCollection.insertOne(addedFood);
        res.send(result);
      } catch (err) {}
    });

    app.get("/food/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await foodCollection.find(query).toArray();
      res.send(result);
    });

    app.patch("/food/:id", async (req, res) => {
      const requestedDoc = req.body;
      const id = req.params.id;
      const options = { upsert: true };
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: { ...requestedDoc },
      };
      const result = await foodCollection.updateOne(filter, updateDoc, options);
      res.send(result);
    });

    app.post("/food/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await foodCollection.deleteOne(query);
      res.send(result);
    });

    app.put("/food/:id", async (req, res) => {
      const updateDocument = req.body;
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          ...updateDocument,
        },
      };
      const result = await foodCollection.updateOne(query, updateDoc, options);
      res.send(result);
    });
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  }
}

app.get("/", async (req, res) => {
  res.send("hello bot");
});

app.listen(port, () => {
  console.log("Server is running on port", port);
});

run().catch((error) => {
  console.error("Error starting server:", error);
});
