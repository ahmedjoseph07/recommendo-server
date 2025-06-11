const express = require("express");
require("dotenv").config();
const port = process.env.PORT || 3000;
const cors = require("cors");
const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.send({ message: "Welcome to Recommendo Server" });
});

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const client = new MongoClient(process.env.MONGODB_URI, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    },
});

let database;
let queriesCollection;

async function run() {
    try {
        await client.db("admin").command({ ping: 1 });
        console.log(
            "Pinged your deployment. You successfully connected to MongoDB!"
        );
        database = await client.db("recommendo");
        queriesCollection = database.collection("queries");
    } catch (err) {
        console.log("Database Error : ", err);
    }
}
run().catch(console.dir);

app.post("/api/add-query", async (req, res) => {
    try {
        const { queryData } = req.body;
        const result = await queriesCollection.insertOne(queryData);
        if (!queryData) {
            res.status(400).send({ message: "No queryData found" });
        }
        res.status(201).send({
            message: "Query Inserted",
            insertedId: result.insertedId,
        });
    } catch (err) {
        console.error(err);
        res.status(500).send({ message: "Internal Server Error" });
    }
});

app.get("/api/queries", async (req, res) => {
    try {
        const query = await queriesCollection.find({}).toArray();
        res.send(query);
    } catch (err) {
        console.error(err);
        res.status(500).send({ message: "Internel Server Error" });
    }
});

app.get("/api/my-queries", async (req, res) => {
    const { email } = req.query;
    if (!email) {
        return res.status(400).send({ message: "Email query required" });
    }

    try {
        const myQueries = await queriesCollection
            .find({ userEmail: email })
            .toArray();
        res.send(myQueries);
    } catch (err) {
        console.error(err);
        res.status(500).send({ message: "Internel Server Error" });
    }
});

app.get("/api/update/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const query = await queriesCollection.findOne({
            _id: new ObjectId(id),
        });
        if (!query) {
            return res.status(404).send({ message: "Query not found" });
        }
        res.send(query);
    } catch (err) {
        console.error(err);
        res.status(500).send({ message: "Internel Server Error" });
    }
});

app.put("/api/update/:id", async (req, res) => {
    const { id } = req.params;
    const { updatedQuery } = req.body;

    try {
        const result = await queriesCollection.updateOne(
            { _id: new ObjectId(id) },
            { $set: updatedQuery }
        );
        if (result.modifiedCount == 0) {
            return res.status(404).send({ message: "Query not updated" });
        }
        res.send({ message: "Query updated successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).send({ message: "Internel Server Error" });
    }
});

app.delete("/api/delete/:id",async(req,res)=>{
    const {id} = req.params;

    try {
        const result = await queriesCollection.deleteOne({_id: new ObjectId(id)});
        if(result.deletedCount === 0){
            return res.status(404).send({ message: "Query not found or already deleted" });
        }
        res.status(200).send({message:"Query Deleted Successfully"});
    } catch (err) {
        console.error(err);
        res.status(500).send({ message: "Internal Server Error" });
    }
})

app.listen(port, () => {
    console.log(`Server Running on port ${port}`);
});
