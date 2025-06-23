const express = require("express");
require("dotenv").config();
const port = process.env.PORT || 3000;
const cors = require("cors");
const jwt = require("jsonwebtoken");
var admin = require("firebase-admin");

const decodedFirebaseKey = Buffer.from(
    process.env.FB_SERVICE_KEY,
    "base64"
).toString("utf-8");
var serviceAccount = JSON.parse(decodedFirebaseKey);

const app = express();

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

// Built-in Middlewares
app.use(
    cors({
        origin: ["http://localhost:5173", "https://recommendo-91de5.web.app"],
        credentials: true,
    })
);
app.use(express.json());

app.get("/", (req, res) => {
    res.send({ message: "Welcome to Recommendo Server" });
});

// DB Connection
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const client = new MongoClient(process.env.MONGODB_URI, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    },
});

// let database;
// let queriesCollection;
// let recommendationCollection;

// async function run() {
//     try {
//         await client.db("admin").command({ ping: 1 });
//         console.log(
//             "Pinged your deployment. You successfully connected to MongoDB!"
//         );
        
//     } catch (err) {
//         console.error("Database Error : ", err);
//     }
// }
// run().catch(console.dir);

const database = client.db("recommendo");
const queriesCollection = database.collection("queries");
const recommendationCollection = database.collection("recommendations");

// Middlewares
const verifyJWT = async (req, res, next) => {
    const token = req?.headers?.authorization?.split(" ")[1];
    if (!token) {
        return res.status(401).send({ message: "Unauthorized Access" });
    }
    try {
        const decoded = await admin.auth().verifyIdToken(token);
        req.tokenEmail = decoded.email;
        next();
    } catch (err) {
        console.error(err);
        return res.status(401).send({ message: "Unauthorized Access" });
    }
};

// Api Endpoints
app.post("/api/add-query", verifyJWT, async (req, res) => {
    const { queryData } = req.body;
    const decodedEmail = req.tokenEmail;
    if (decodedEmail != queryData.userEmail) {
        return res.status(403).send({ message: "Forbidden Access" });
    }
    if (!queryData) {
        res.status(400).send({ message: "No queryData found" });
    }
    try {
        const result = await queriesCollection.insertOne(queryData);
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

app.get("/api/my-queries", verifyJWT, async (req, res) => {
    const decodedEmail = req.tokenEmail;
    const { email } = req.query;

    if (decodedEmail !== email) {
        return res.status(403).send({ message: "Forbidden Access" });
    }

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

app.get("/api/query/:id", async (req, res) => {
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

app.delete("/api/delete/:id", async (req, res) => {
    const { id } = req.params;

    try {
        const result = await queriesCollection.deleteOne({
            _id: new ObjectId(id),
        });
        if (result.deletedCount === 0) {
            return res
                .status(404)
                .send({ message: "Query not found or already deleted" });
        }
        res.status(200).send({ message: "Query Deleted Successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).send({ message: "Internal Server Error" });
    }
});

app.post("/api/add-recommendation", async (req, res) => {
    const { recommendationData } = req.body;
    if (!recommendationData) {
        return res.status(400).send({ message: "No RecommendationData Found" });
    }
    try {
        const result = await recommendationCollection.insertOne(
            recommendationData
        );
        await queriesCollection.updateOne(
            { _id: new ObjectId(recommendationData.queryId) },
            { $inc: { recommendationCount: 1 } }
        );
        res.status(201).send({
            message: "Recommendation Added Successfully",
            insertedId: result.insertedId,
        });
    } catch (err) {
        console.error(err);
        res.status(500).send({ message: "Internal Server Error" });
    }
});

app.get("/api/recommendations/:queryId", async (req, res) => {
    const { queryId } = req.params;
    try {
        const result = await recommendationCollection
            .find({ queryId })
            .toArray();
        res.send(result);
    } catch (err) {
        console.error(err);
        res.status(500).send({ message: "Internal Server Error" });
    }
});

app.get("/api/my-recommendations/:email", async (req, res) => {
    const { email } = req.params;
    try {
        const result = await recommendationCollection
            .find({ recommenderEmail: email })
            .toArray();
        res.send(result);
    } catch (err) {
        console.error(err);
        res.status(500).send({ message: "Internal Server Error" });
    }
});

app.delete("/api/delete-rec/:id/:queryId", async (req, res) => {
    const { id, queryId } = req.params;
    try {
        const result = await recommendationCollection.deleteOne({
            _id: new ObjectId(id),
        });
        if (result.deletedCount === 0) {
            return res
                .status(404)
                .send({ message: "Query not found or already deleted" });
        }
        await queriesCollection.updateOne(
            { _id: new ObjectId(queryId) },
            { $inc: { recommendationCount: -1 } }
        );
        res.status(200).send({ message: "Query Deleted Successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).send({ message: "Internal Server Error" });
    }
});

app.get("/api/recommended", async (req, res) => {
    const { userEmail } = req.query;
    if (!userEmail) {
        return res.status(400).send({ message: "User Email Not Found" });
    }
    try {
        const userQueries = await queriesCollection
            .find({ userEmail })
            .toArray();

        const results = await Promise.all(
            userQueries.map(async (query) => {
                const recommendations = await recommendationCollection
                    .find({ queryId: query._id.toString() })
                    .toArray();
                return {
                    queryTitle: query.queryTitle,
                    productName: query.productName,
                    productBrand: query.productBrand,
                    queryId: query._id,
                    recommendations,
                };
            })
        );
        res.send(results);
    } catch (err) {
        console.error(err);
        res.status(500).send({ message: "Internal Server Error" });
    }
});

app.listen(port, () => {
    console.log(`Server Running on port ${port}`);
});
