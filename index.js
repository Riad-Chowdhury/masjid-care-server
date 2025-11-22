const express = require("express");
const cors = require("cors");
const app = express();

require("dotenv").config();
const port = process.env.PORT || 3000;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
app.use(cors());
app.use(express.json());

const uri = process.env.DB_URL;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const postsCollection = client.db("masjidCare").collection("posts");
    const ramadanScheduleCollection = client
      .db("masjidCare")
      .collection("ramadanSchedule");
    const contactCollection = client.db("masjidCare").collection("contact");

    //
    app.get("/posts", async (req, res) => {
      try {
        const result = await postsCollection.find().toArray();
        res.send(result);
      } catch (err) {
        res.status(500).send({ error: "Failed to fetch posts" });
      }
    });

    // POST: Add New Post
    app.post("/posts", async (req, res) => {
      try {
        const post = req.body;
        post.createdAt = new Date(); // auto date added
        const result = await postsCollection.insertOne(post);
        res.send(result);
      } catch (err) {
        res.status(500).send({ error: "Failed to add post" });
      }
    });

    app.delete("/posts/:id", async (req, res) => {
      try {
        const id = req.params.id;
        await postsCollection.deleteOne({ _id: new ObjectId(id) });
        res.json({ message: "Post deleted" });
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
      }
    });

    // Ramadan Schedule
    app.post("/ramadanSchedule", async (req, res) => {
      const schedule = req.body;
      const result = await ramadanScheduleCollection.insertOne(schedule);
      res.send(result);
    });
    app.get("/ramadanSchedule", async (req, res) => {
      const result = await ramadanScheduleCollection.find().toArray();
      res.send(result);
    });

    app.delete("/ramadanSchedule/:id", async (req, res) => {
      const id = req.params.id;
      const result = await ramadanScheduleCollection.deleteOne({
        _id: new ObjectId(id),
      });
      res.send(result);
    });

    // contactCollection ⬇

    app.get("/contact", async (req, res) => {
      const result = await contactCollection.find().toArray();
      res.send(result);
    });

    app.post("/contact", async (req, res) => {
      const contact = req.body;
      const result = await contactCollection.insertOne(contact);
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello, World!");
});
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
