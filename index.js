const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser')
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors({
  origin: [
    'http://localhost:5173'

  ],
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.fd2onld.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});


//user defined middleware
const logger = async (req, res, next) => {
  console.log('called', req.hostname, req.originalUrl);
  next();
}

const verifyToken = async (req, res, next) => {
  const token = req.cookies?.token;
  //console.log('token in middleware', token)
  if (!token) {
    return res.status(401).send({ message: 'Not Authorized' })
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      console.log(err)
      return res.status(401).send({ message: 'unauthorized' })
    }
    console.log('value in the token', decoded)
    req.user = decoded;
    next()
  })

}

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    //await client.connect();
    const categoryCollection = client.db('jobDB').collection('category');
    const jobCollection = client.db('jobDB').collection('jobs');
    const appliedJobCollection = client.db('jobDB').collection('applied');

    //Auth related Api
    app.post('/jwt', logger, async (req, res) => {
      const user = req.body;
      console.log('user for token', user);

      //token generating
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
      //res.send({token});
      res
        //set token in cookie
        .cookie('token', token, {
          httpOnly: true,
          secure: true,
          sameSite: 'none'

        })
        .send({ success: true });
    })

    app.post('/logout', async (req, res) => {
      const user = req.body;
      console.log('logging Out', user);
      res.clearCookie('token', { maxAge: 0 }).send({ success: true })
    })


    app.get('/category', async (req, res) => {
      const cursor = categoryCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    })

    app.post('/jobs', async (req, res) => {
      const newJob = req.body;
      console.log(newJob);
      const result = await jobCollection.insertOne(newJob);
      res.send(result);
    })

    app.put('/jobs/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) }
      const options = { upsert: true };
      const job = req.body;
      const updatedJob = {
        $set: {
          poster: job.poster,
          email: job.email,
          title: job.title,
          category: job.category,
          photo: job.photo,
          salary: job.salary,
          deadline: job.deadline,
          pDate: job.pDate,
          description: job.description,

        }
      }
      const result = await jobCollection.updateOne(filter, updatedJob, options);
      res.send(result);
    })

    app.patch('/jobs/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) }
      const updatedJob = req.body;
      console.log(updatedJob, 2);
      const updateDoc = {
        $set: {
          applicants: updatedJob.applicants
        },
      };
      const result = await jobCollection.updateOne(filter, updateDoc);
      res.send(result)
    })

    app.get('/jobs', async (req, res) => {
      const cursor = jobCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    })

    app.get('/jobs/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await jobCollection.findOne(query)
      res.send(result)
    })

    app.delete('/jobs/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }

      const result = await jobCollection.deleteOne(query);
      res.send(result);
    })


    app.post('/applied', async (req, res) => {
      // console.log(req.query.email);
      // //console.log('token',req.cookies.token)
      // console.log('from valid token ', req.user)
      // if(req.query.email!==req.user.email){
      //   return res.status(403).send({message: 'forbidden access'})
      // }
      // let query = {};
      // if (req.query?.email) {
      //   query = { email: req.query.email }
      // }
      const appliedJob = req.body;
      console.log(appliedJob);
      const result = await appliedJobCollection.insertOne(appliedJob);
      res.send(result);
    })


    app.get('/applied', logger, verifyToken, async (req, res) => {
      console.log(req.query.email);
      //console.log('token',req.cookies.token)
      console.log('from valid token ', req.user)
      if(req.query.email!==req.user.email){
        return res.status(403).send({message: 'forbidden access'})
      }
      let query = {};
      if (req.query?.email) {
        query = { email: req.query.email }
      }
      const cursor = appliedJobCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    })


    // Send a ping to confirm a successful connection
    //await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.get('/', (req, res) => {
  res.send('job Seeking server is running');
})

app.listen(port, () => {
  console.log(`server running on ${port}`);
})