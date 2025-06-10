const express = require("express");
require("dotenv").config();
const port = process.env.PORT || 3000;
const app = express();

app.get("/", (req, res) => {
    res.send({ message: "Working" });
});

const { MongoClient, ServerApiVersion } = require("mongodb");

const client = new MongoClient(process.env.MONGODB_URI, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    },
});

async function run() {
    try {
        await client.db("admin").command({ ping: 1 });
        console.log(
            "Pinged your deployment. You successfully connected to MongoDB!"
        );
    } catch (err) {
        console.log(err);
    }
}
run().catch(console.dir);


app.listen(port, () => {
    console.log(`Server Running on port ${port}`);
});
