const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.fd2onld.mongodb.net/?retryWrites=true&w=majority`;

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
    //await client.connect();
    const categoryCollection = client.db('jobDB').collection('category');
    const jobCollection = client.db('jobDB').collection('jobs');
    const appliedJobCollection = client.db('jobDB').collection('applied');
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
      console.log(updatedJob,2);
      const updateDoc = {
        $set: {
          applicants: updatedJob.applicants
        },
      };
      const result = await jobCollection.updateOne(filter,updateDoc);
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
      const appliedJob = req.body;
      console.log(appliedJob);
      const result = await appliedJobCollection.insertOne(appliedJob);
      res.send(result);
    })


    app.get('/applied/', async (req, res) => {
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