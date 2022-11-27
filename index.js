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
        const bookingsCollection = client.db('shareWear').collection('bookings');
        const usersCollection = client.db('shareWear').collection('users');

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
            const query = { categoryId: id };
            const products = await productsCollection.find(query).toArray();
            res.send(products)
        });

        // book a product api
        app.post('/bookings', async (req, res) => {
            const booking = req.body;
            const result = await bookingsCollection.insertOne(booking);
            console.log('yes!! booked');
            res.send(result);
        });

        // insert user api        
        app.post('/users', async (req, res) => {
            const userInfo = req.body;

            //checking if user with same email address already inserted
            const query = { email: userInfo.email }
            const alreadyBooked = await usersCollection.find(query).toArray();
            if (alreadyBooked.length) {
                const message = `Already registered with email ${userInfo.email}`
                return res.send({ acknowledged: false, message })
            }

            const result = await usersCollection.insertOne(userInfo);
            res.send(result);
        });


        app.get('/users/admin/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email }
            const user = await usersCollection.findOne(query);
            res.send({ isAdmin: user?.role === 'admin' });
        })

        app.get('/users/buyer/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email }
            const user = await usersCollection.findOne(query);
            res.send({ isBuyer: user?.role === 'buyer' });
        })

        app.get('/users/seller/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email }
            const user = await usersCollection.findOne(query);
            res.send({ isSeller: user?.role === 'seller' });
        })

        //insert product api
        app.post('/products', async (req, res) => {
            const product = req.body;
            const result = await productsCollection.insertOne(product);
            res.send(result);
        });

        //products for specific user api
        app.get('/products', async (req, res) => {
            const email = req.query.email;
            const query = { email: req.query.email };
            const doctors = await productsCollection.find(query).toArray();
            res.send(doctors);
        })

        //delete product api
        app.delete('/product/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const result = await productsCollection.deleteOne(filter);
            res.send(result);
        })

        // update product for advertisement
        app.put('/product/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) }
            const options = { upsert: true };
            const updatedProduct = {
                $set: {
                    advertisement: 'yes'
                }
            }
            const result = await productsCollection.updateOne(filter, updatedProduct, options);
            res.send(result);
        });

        //get advertised products api
        app.get('/advertisement/products', async (req, res) => {
            const query = { advertisement: 'yes' };
            const products = await productsCollection.find(query).toArray();
            res.send(products)
        });

    }
    finally {

    }
}

run().catch(err => console.error(err));
