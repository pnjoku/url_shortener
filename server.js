'use strict';

var app = require('express')();
var bodyParser = require('body-parser');
var path = require('path');
var mongo = require('mongodb');
require('dotenv').config({
  silent: true
});

mongo.MongoClient.connect(process.env.MONGODBURL || 'mongodb://localhost:27017/url-shortener', function(err, db) {

  if (err) {
    throw new Error('Database failed to connect!');
  } else {
    console.log('Successfully connected to MongoDB on port 27017.');
  }
  
    db.createCollection("sites", {
    capped: true,
    size: 5242880,
    max: 5000
  });

var port = 8080;

app.listen(port, function(){

  console.log("url-shortener Started");
});




app.use(bodyParser.json());
app.get('/', function(req,res){res.send('put a new url in as parameter after "/shorten/" to shorten it')});

app.get('/:url', function(req, res){
  var url = process.env.APP_URL + req.params.url;
    if (url != process.env.APP_URL + 'favicon.ico') {
      db.collection('sites').findOne({
      "short_url": url
    }, function(err, result) {
      if (err) throw err;
      if (result) {
        console.log('Found ' + result);
        console.log('Redirecting to: ' + result.original_url);
        res.redirect(result.original_url);
      } else {
        res.send({
        "error": "This url is not in the database."
      });
      }
    });
    }
});

app.get('/shorten/:url*', handlePost);

function handlePost(req, res) {
    var url = req.url.slice(9);
    //console.log(url);
    var urlObj = {};
    if (validateURL(url)) {
      urlObj = {
        "original_url": url,
        "short_url": process.env.APP_URL + linkGen()
      };
      res.status(201).send(urlObj);
      db.collection('sites').save(urlObj, function(err, result) {
      if (err) throw err;
      console.log('Saved ' + result);
    });
    } else {
      urlObj = {
        "error": "Wrong url format, make sure you have a valid protocol and real site."
      };
      res.status(500).send(urlObj);
    }
  }
  
  
   function validateURL(url) {
    // Checks to see if it is an actual url
    // Regex from https://gist.github.com/dperini/729294
    var regex = /^(?:(?:https?|ftp):\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,}))\.?)(?::\d{2,5})?(?:[/?#]\S*)?$/i;
    return regex.test(url);
  }
  
   function linkGen() {
    var num = Math.floor(200000 + Math.random() * 700000);
    return num.toString().substring(0, 6);
  }
  
});