const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// middle wares
app.use(cors());
app.use(express.json());

//mongoDb uri
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.mzfy2kt.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

app.get('/', (req, res) => {
    res.send('Share Wear API Running');
})

app.listen(port, () => {
    console.log('Share Wear Server Running on Port', port);
})

async function run() {
    try {
        const categoriesCollection = client.db('shareWear').collection('categories');
        const productsCollection = client.db('shareWear').collection('products');

        // get categories api
        app.get('/categories', async (req, res) => {
            // const options = await appointmentOptionCollection.find(query).toArray();
            const query = {}
            const categories = await categoriesCollection.find(query).toArray();
            res.send(categories);
        });

        // get products api
        app.get('/category/:id', async (req, res) => {
            const id = req.params.id;
            console.log('api kam kortese', id);
            const query = { categoryId: id };
            const products = await productsCollection.find(query).toArray();
            res.send(products)
        });

    }
    finally {

    }
}

run().catch(err => console.error(err));
