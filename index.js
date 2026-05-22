const dns = require('node:dns');
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const app = express();
app.use(express.json());
app.use(cors());
dotenv.config();

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const { createRemoteJWKSet, jwtVerify } = require('jose-cjs');

const uri = process.env.MONGODB_URI
const PORT = process.env.PORT

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

const JWKS = createRemoteJWKSet(
    new URL(`${process.env.BETTER_AUTH_URL}/api/auth/jwks`)
)

const VerifyToken = async (req, res, next) => {
    const authHeader = req?.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];

    if (!token || token === "undefined" || token === "null") {
        return res.status(401).json({ message: "Unauthorized: Token is missing or corrupted" });
    }

    try {
        const { payload } = await jwtVerify(token, JWKS);
        next();
    }
    catch (error) {
        console.error("Verification Error details:", error);
        return res.status(403).json({ message: "Forbidden" });
    }

}

const run = async () => {
    try {
        // await client.connect();
        const db = client.db('TurfHQ');
        const facilitiesCollection = db.collection('facilities');
        const bookingsCollection = db.collection('bookings');

        app.get('/facilities', async (req, res) => {
            try {
                const { searchTerm, type } = req.query;
                let query = {};

                if (searchTerm) {
                    query.name = {
                        $regex: searchTerm,
                        $options: 'i'
                    };
                }

                if (type) {
                    query.facility_type = { $in: [type] };
                }

                const facilities = await facilitiesCollection.find(query).toArray();
                res.send(facilities);
            } catch (error) {
                console.error("Error fetching facilities:", error);
                res.status(500).send({ message: "Internal Server Error" });
            }
        })

        app.get('/facilities/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const facility = await facilitiesCollection.findOne(query);
            res.send(facility);
        })

        app.post('/facilities', async (req, res) => {
            const facility = req.body;
            const newFacility = await facilitiesCollection.insertOne(facility);
            res.send(newFacility);
        })

        app.delete('/facilities/:id', VerifyToken, async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await facilitiesCollection.deleteOne(query);
            res.send(result);
        })


        app.get('/my-facilities', VerifyToken, async (req, res) => {
            const email = req.query.email;
            const facilities = await facilitiesCollection.find({ owner_email: email }).toArray();
            res.send(facilities);
        })

        app.patch('/facilities/:id', VerifyToken, async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const doc = req.body;
            const updateDoc = { $set: doc };
            const result = await facilitiesCollection.updateOne(query, updateDoc);
            res.send(result);
        })

        app.get('/bookings', async (req, res) => {
            const email = req.query.email;
            const bookings = await bookingsCollection.find({ user_email: email }).toArray();
            res.send(bookings);
        })

        app.post('/bookings', VerifyToken, async (req, res) => {
            const facility = req.body;
            const newBookings = await bookingsCollection.insertOne(facility);
            res.send(newBookings);
        })

        app.delete('/bookings/:id', VerifyToken, async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await bookingsCollection.deleteOne(query);
            res.send(result);
        })

        app.patch('/bookings/:id', VerifyToken, async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const doc = req.body;
            const updateDoc = { $set: doc };
            const result = await bookingsCollection.updateOne(query, updateDoc);
            res.send(result);
        })
    }

    finally {

        // await client.close();
    }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Hello World');
})

app.listen(PORT, () => {
    console.log(`Server is running on PORT ${PORT}`);
})