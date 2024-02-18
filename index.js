require('dotenv').config();
const express = require('express');
const cors = require('cors');
const dns = require('dns')
const app = express();
const {MongoClient} = require('mongodb')

const client = new MongoClient(process.env.DB_URL)
const db = client.db("urlshortener")
const urls = db.collection("urls")

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json())
app.use(express.urlencoded({extended:true}))

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.post('/api/shorturl', function(req, res) {
  // console.log(req.body)
  const original_url = req.body.url
  dns.lookup(new URL(original_url).hostname, async (err, address) => {
    if(err || !address){
      res.json({error:"Invalid URL"})
      return
    }
    const data = await urls.findOne({url:original_url})
    if(data){
      res.json({original_url:data.url, short_url: data.short_url})
    }else{
      const urlCount = await urls.countDocuments({})
      const urlDoc = {url: original_url, short_url: urlCount}
      const result = await urls.insertOne(urlDoc)
      res.json({original_url:original_url, short_url: urlCount})
    }
  })
});

app.get('/api/shorturl/:short_url', async (req,res) => {
  const short_url = req.params.short_url
  const urlDoc = await urls.findOne({short_url: +short_url})
  if(urlDoc)  res.redirect(urlDoc.url)
  else        res.json({error: "No short URL found for the given input"})
})

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
