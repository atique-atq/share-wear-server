const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

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
        const paymentsCollection = client.db('shareWear').collection('payments');

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
            res.send({
                isSeller: user?.role === 'seller',
                isVerified: user?.verification === 'verified'
            });
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
            const query = { advertisement: 'yes', status: 'available' };
            const products = await productsCollection.find(query).toArray();
            res.send(products)
        });

        // update product for report
        app.put('/report/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) }
            const options = { upsert: true };
            const updatedProduct = {
                $set: {
                    reported: true
                }
            }
            const result = await productsCollection.updateOne(filter, updatedProduct, options);
            res.send(result);
        });

        //get all sellers from admin
        app.get('/users/sellers', async (req, res) => {
            const query = { role: 'seller' };
            const sellers = await usersCollection.find(query).toArray();
            res.send(sellers)
        });

        //get all buyers from admin
        app.get('/users/buyers', async (req, res) => {
            const query = { role: 'buyer' };
            const buyers = await usersCollection.find(query).toArray();
            res.send(buyers)
        });

        //verify seller
        app.put('/seller/verify', async (req, res) => {
            const id = req.query.id;
            const email = req.query.email;
            const filter = { _id: ObjectId(id) }
            const options = { upsert: true };
            const verifiedSeller = {
                $set: {
                    verification: 'verified'
                }
            }
            const result = await usersCollection.updateOne(filter, verifiedSeller, options);

            //update product table for verifying 
            const queryForProducts = { email: email }
            const anyProductForEmail = await productsCollection.find(queryForProducts).toArray();
            if (anyProductForEmail?.length > 0) {
                const verifiedProductsDoc = {
                    $set: {
                        verification: 'verified'
                    }
                }
                await productsCollection.updateMany(queryForProducts, verifiedProductsDoc, options);
            }

            res.send(result);
        });

        //get all buyers from admin
        app.get('/users/buyers', async (req, res) => {
            const query = { role: 'buyer' };
            const buyers = await usersCollection.find(query).toArray();
            res.send(buyers)
        });

        //delete seller
        app.delete('/seller/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const result = await usersCollection.deleteOne(filter);
            res.send(result);
        })

        //get bookings
        app.get('/bookings', async (req, res) => {
            const email = req.query.email;
            const query = { userEmail: email };
            const bookings = await bookingsCollection.find(query).toArray();
            res.send(bookings);
        });

        //get specific bookings
        app.get('/bookings/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const booking = await bookingsCollection.findOne(query);
            res.send(booking);
        })

        //create payment intend
        app.post('/create-payment-intent', async (req, res) => {
            const booking = req.body;
            const price = booking.price;
            const amount = price * 100;

            const paymentIntent = await stripe.paymentIntents.create({
                currency: 'usd',
                amount: amount,
                "payment_method_types": [
                    "card"
                ]
            });
            res.send({
                clientSecret: paymentIntent.client_secret,
            });
        });

        //payment api
        app.post('/payments', async (req, res) => {
            const payment = req.body;
            const result = await paymentsCollection.insertOne(payment);
            //update boooking table
            const id = payment.bookingId
            const filter = { _id: ObjectId(id) }
            const updatedDoc = {
                $set: {
                    paid: true,
                    transactionId: payment.transactionId
                }
            }
            const updatedResult = await bookingsCollection.updateOne(filter, updatedDoc);
            //update product table
            const productId = payment.productId;
            const productFilter = { _id: ObjectId(productId) };
            // const options = { upsert: true };
            const updatedDocForProduct = {
                $set: {
                    status: "sold",
                }
            }
            const productResult = await productsCollection.updateOne(productFilter, updatedDocForProduct);
            console.log('in the payment section', productResult);
            res.send(result);
        })

        //get all sellers from admin
        app.get('/products/reported', async (req, res) => {
            const query = { reported: true };
            const reportedItems = await productsCollection.find(query).toArray();
            res.send(reportedItems)
        });


    }
    finally {

    }
}

run().catch(err => console.error(err));
