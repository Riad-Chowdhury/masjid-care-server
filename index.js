const express = require("express");
const cors = require("cors");
const app = express();

require("dotenv").config();
const stripe = require("stripe")(process.env.PAYMENT_SUCCESS_URL);

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
    // await client.connect();

    const postsCollection = client.db("masjidCare").collection("posts");
    const ramadanScheduleCollection = client
      .db("masjidCare")
      .collection("ramadanSchedule");
    const contactCollection = client.db("masjidCare").collection("contact");
    const usersCollection = client.db("masjidCare").collection("users");

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

    app.get("/contact/:id", async (req, res) => {
      const id = req.params.id;

      const result = await contactCollection.findOne({
        _id: new ObjectId(id),
      });
      res.send(result);
    });
    app.post("/contact", async (req, res) => {
      const contact = req.body;
      const result = await contactCollection.insertOne(contact);
      res.send(result);
    });

    app.put("/contact/:id", async (req, res) => {
      const { id } = req.params;
      const { name, phone, address, image } = req.body;
      const query = { _id: new ObjectId(id) };

      const updateData = {
        $set: {
          name,
          phone,
          address,
          image,
        },
      };

      const result = await contactCollection.updateOne(query, updateData);
      res.send(result);
    });

    app.delete("/contact/:id", async (req, res) => {
      const id = req.params.id;
      const result = await contactCollection.deleteOne({
        _id: new ObjectId(id),
      });
      res.send(result);
    });
    app.get("/users", async (req, res) => {
      const result = await usersCollection.find().toArray();
      res.send(result);
    });
    app.get("/users/:id", async (req, res) => {
      const id = req.params.id;
      const result = await usersCollection.findOne({ _id: new ObjectId(id) });
      res.send(result);
    });
    app.post("/users", async (req, res) => {
      const user = req.body;
      const result = await usersCollection.insertOne(user);
      res.send(result);
    });

    app.delete("/users/:id", async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const result = await usersCollection.deleteOne({ _id: new ObjectId(id) });
      res.send(result);
    });
    // ////
    //  monthly fee payment api
    app.post("/create-checkout-session", async (req, res) => {
      const amount = req.body.amount;

      const session = await stripe.checkout.sessions.create({
        ui_mode: "custom",
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: "Your Product",
              },
              unit_amount: amount, // $20.00
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        return_url: `${YOUR_DOMAIN}/complete?session_id={CHECKOUT_SESSION_ID}`,
      });

      res.send({ clientSecret: session.client_secret });
    });

    app.use((req, res, next) => {
      console.log(req.method, req.url);
      next();
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
