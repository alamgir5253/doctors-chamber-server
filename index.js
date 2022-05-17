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

// to verify token 
 const verifyToken = (req,res,next)=>{
  const authHeader = req.headers.authorization
  if(!authHeader){
    return res.status(401).send({massage:'unauthorize entry'})
  }
  const token = authHeader.split(' ')[1]
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function(err, decoded) {
    if(err){
      return res.status(403).send({massage:'forbidden access'})
    }
    req.decoded =decoded
    next()
  });

 }

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
  app.get('/booking',verifyToken, async(req,res) =>{
    const patient = req.query.patient
    const decodedEmail = req.decoded.email
 if(patient === decodedEmail){

   const query ={patient: patient}
   const booking = await bookingCollection.find(query).toArray()
  return res.send(booking)
 }else{
  return res.status(403).send({massage:'forbidden access'})
 }
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



  // user get api start 
  app.get('/user', async(req, res) =>{
    const users = await userCollection.find().toArray()
    res.send(users)
  })
    // user put api start 
    app.put('/user/:email', async(req,res) =>{
      const email = req.params.email
      const user = req.body
      const filter = { email:email};
      const options = { upsert: true };
      const updateDoc = {
        $set:user
      };
      const result = await userCollection.updateOne(filter, updateDoc, options);
      const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN_SECRET);
      res.send({result, token})

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