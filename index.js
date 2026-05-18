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

const uri = process.env.MONGODB_URI
const PORT = process.env.PORT

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

const run = async () => {
    try {
        await client.connect();
        const db = client.db('TurfHQ');
        const facilitiesCollection = db.collection('facilities');
        const bookingsCollection = db.collection('bookings');

        app.get('/facilities', async (req, res) => {
            const facilities = await facilitiesCollection.find().toArray();
            res.send(facilities);
        })

        app.get('/my-facilities', async (req, res) => {
            const email = req.query.email;
            const facilities = await facilitiesCollection.find({ owner_email: email }).toArray();
            res.send(facilities);
        })

        app.get('/facilities/:id', async (req, res) => {
            const header = req.header.authorization;
            
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

        app.delete('/facilities/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await facilitiesCollection.deleteOne(query);
            res.send(result);
        })

        app.patch('/facilities/:id', async (req, res) => {
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

        app.get('/bookings/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const bookings = await bookingsCollection.findOne(query);
            res.send(bookings);
        })

        app.post('/bookings', async (req, res) => {
            const facility = req.body;
            const newBookings = await bookingsCollection.insertOne(facility);
            res.send(newBookings);
        })

        app.delete('/bookings/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await bookingsCollection.deleteOne(query);
            res.send(result);
        })

        app.patch('/bookings/:id', async (req, res) => {
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