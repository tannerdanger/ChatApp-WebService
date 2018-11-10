/**
 * Tanner Brown
 * @type {router}
 * Router for handling weather forecast retrieval.
 */

const API_KEY = process.env.WEATHER_KEY;

//express is the framework we're going to use to handle requests
const express = require('express');

//request module is needed to make a request to a web service
const request = require('request');


//retrieve the router object from express
var router = express.Router();

const bodyParser = require("body-parser");
//This allows parsing of the body of POST requests, that are encoded in JSON
router.use(bodyParser.json());

//add a post route to the router.
router.post("/current", (req, res) => {
    console.log(req.body);
    let lat = req.body['lat'];
     let lon = req.body['lon'];
     //base values in case lat/lon is empty
     if(!lat || !lon) {
        lat = 47.2098;
        lon = -122.4090;
    }
    let url = `https://api.weatherbit.io/v2.0/current?lat=${lat}&lon=${lon}&key=${API_KEY}`

    console.log(url);

    request(url, function(error, response, body) {
        if(error){
            res.send(error);
        } else {
            res.send(body);
        }
    });
});

//add a get route to the router.
router.post("/day", (req, res) => {

    console.log(req.body);
    let lat = req.body['lat'];
    let lon = req.body['lon'];
    //base values in case lat/lon is empty
    if(!lat || !lon) {
        lat = 47.2098;
        lon = -122.4090;
    }

    let url = `https://api.weatherbit.io/v2.0/forecast/daily?lat=${lat}&lon=${lon}&days=1&key=${API_KEY}`

    console.log(url);

    request(url, function(error, response, body) {
        if(error){
            res.send(error);
        } else {
            res.send(body);
        }
    });
});


router.post("/tenday", (req, res) => {
    console.log(req.body);
    let lat = req.body['lat'];
    let lon = req.body['lon'];
    //base values in case lat/lon is empty
    if(!lat || !lon) {
        lat = 47.2098;
        lon = -122.4090;
    }

    let url = `https://api.weatherbit.io/v2.0/forecast/daily?lat=${lat}&lon=${lon}&days=10&key=${API_KEY}`

    console.log(url);

    request(url, function(error, response, body) {
        if(error){
            res.send(error);
        } else {
            res.send(body);
        }
    });
});


// "return" the router
module.exports = router;
