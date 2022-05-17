const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();
const port = process.env.PORT || 5000
const app =express()
// middle ware 
app.use(cors())
app.use(express.json())

// mongodb connection
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.az5ds.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


async function run(){
try{
  await client.connect();
  const servicesCollection = client.db("doctors_chamber").collection("services")
  const bookingCollection = client.db("doctors_chamber").collection("booking")
  const userCollection = client.db("doctors_chamber").collection("user")
  app.get('/services', async(req,res)=>{
    const query = {}
    const cursor = servicesCollection.find(query);
    const result = await cursor.toArray();
    res.send(result)
  })
  // naming convention
  // app.get('/booking') to get all data or more then one by using condition 
  // app.get('/booking/:id') get a specific data
  // app.post('/booking/') to post a data 
  // app.patch('/booking/:id') update or insert a data 
  // app.delete('/booking/:id') to delete a data
  app.get('/booking', async(req,res) =>{
    const patient = req.query.patient
    const query ={patient: patient}
    const booking = await bookingCollection.find(query).toArray()
    res.send(booking)
  })
  
  app.post('/booking', async(req,res) =>{
    const booking = req.body
    const query = { treatmentName: booking.treatmentName, date: booking.date, patient: booking.patient}
    const exists = await bookingCollection.findOne(query)
    if(exists){
     return res.send({success:false, booking:exists})
    }else{
      const result = await bookingCollection.insertOne(booking)
    return res.send({success: true,result})
    }
  })

    // user api start 
    app.put('/user/:email', async(req,res) =>{
      const email = req.params.email
      const user = req.body
      const filter = { email:email};
      const options = { upsert: true };
      const updateDoc = {
        $set:user
      };
      const result = await userCollection.updateOne(filter, updateDoc, options);
      res.send(result)

    })
    


}
finally{
  // client.close();

}
}
run().catch(console.dir)



app.get('/', ( req, res )=>{
  res.send(' process success')
})
app.listen(port, ()=>{
  console.log('listening to port', port);
})