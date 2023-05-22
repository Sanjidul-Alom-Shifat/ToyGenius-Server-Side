const express = require('express');
const app = express();
require('dotenv').config();
const port = process.env.PORT || 5000;
const cors = require('cors')

// middleware
app.use(cors());
app.use(express.json());

// server for mongodb

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.q5tkpfw.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();

        const toyCollection = client.db('ToyGenius').collection('alltoys');

        const indexKeys = { toyName: 1 };
        const indexOptions = { name: "toyname" };

        const result = await toyCollection.createIndex(indexKeys, indexOptions);

        // search by text
        app.get('/toyname/:text', async (req, res) => {
            const text = req.params.text;
            const result = await toyCollection
                .find({
                    $or: [
                        { toyName: { $regex: text, $options: "i" } },
                    ],
                }).toArray();
            res.send(result)
        })

        // for adding a toy
        app.post('/posttoy', async (req, res) => {
            const body = req.body;
            const result = await toyCollection.insertOne(body);
            if (result?.insertedId) {
                return res.status(200).send(result);
            } else {
                return res.status(404).send({
                    message: "can not insert try again leter",
                    status: false,
                });
            }
        })

        // for find all toys
        app.get('/alltoys', async (req, res) => {
            const result = await toyCollection
                .find({})
                .limit(20)
                .toArray();
            res.send(result);
        })


        // get 
        app.get("/mytoys", async (req, res) => {
            const { sortOrder, sellerEmail } = req?.query;
        
            if (sortOrder && sellerEmail) {
                let query = { sellerEmail: sellerEmail };
                let sortOptions = {};
                sortOptions["price"] = sortOrder === "desc" ? -1 : 1;
        
                try {
                    const result = await toyCollection
                        .find(query)
                        .toArray();
        
                    const sortedResult = result.map(toy => {
                        toy.price = parseFloat(toy.price);
                        return toy;
                    }).sort((a, b) => sortOptions["price"] * (a.price - b.price));
        
                    res.send(sortedResult);
                } catch (error) {
                    console.error(error);
                    res.status(500).json({ message: "Internal server error" });
                }
            } else if (sellerEmail) {
                const query = { sellerEmail: sellerEmail };
                const result = await toyCollection.find(query).toArray();
                res.send(result);
            }
        });
        

        // update toy
        app.put('/updatetoy/:id', async (req, res) => {
            const id = req.params.id;
            const body = req.body;
            const filter = { _id: new ObjectId(id) };
            const updatetoy = {
                $set: {
                    price: body.price,
                    quantity: body.quantity,
                    description: body.description
                }
            };
            const result = await toyCollection.updateOne(filter, updatetoy);
            res.send(result);
        })

        // get specific id from all toy
        app.get('/singletoys/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await toyCollection.findOne(query);
            res.send(result);
            console.log(result)
        })

        // get by category
        app.get("/alltoys/:category", async (req, res) => {
            console.log(req.params.category)
            if (req.params.category == "engineering" || req.params.category == "learning" || req.params.category == "educational") {
                const result = await toyCollection.find({
                    category: req.params.category
                }).toArray()
                return res.send(result)
            }
            const result = await toyCollection.find().toArray()
            res.send(result)
        })

        app.get("/MyToys", async (req, res) => {
            const { sortOrder, sellerEmail } = req?.query;

            if (sortOrder && sellerEmail) {
                let query = { sellerEmail: sellerEmail };
                let sortOptions = {};
                sortOptions["price"] = sortOrder === "desc" ? -1 : 1;

                try {
                    const result = await toysAnimalsCollection
                        .find(query)
                        .sort(sortOptions)
                        .toArray();

                    res.send(result);
                } catch (error) {
                    console.error(error);
                    res.status(500).json({ message: "Internal server error" });
                }
            } else if (sellerEmail) {
                const query = { sellerEmail: sellerEmail };
                const result = await toysAnimalsCollection.find(query).toArray();
                res.send(result);
            }
        });


        app.delete('/singletoys/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await toyCollection.deleteOne(query);
            if (result.deletedCount > 0) {
                res.send({ message: 'Toy deleted successfully' });
            } else {
                res.status(404).send({ message: 'Toy not found' });
            }
        });

        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('Toy genius server side is running now .');
})

app.listen(port, () => {
    console.log(`The toy genius server is running on port : ${port}`);
})