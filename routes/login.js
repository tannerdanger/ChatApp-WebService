/**
 * Tanner Brown
 * @type {router}
 * Router for handling user to login.
 */


//express is the framework we're going to use to handle requests
const express = require('express');



//Create connection to Heroku Database
let db = require('../util/utils').db;
let getHash = require('../util/utils').getHash;
let JSONconsts = require('../util/JSON_defs').JSON_CONSTS;

var router = express.Router();
let queries = require('../util/queries').MISC_QUERIES;
const bodyParser = require("body-parser");
//This allows parsing of the body of POST requests, that are encoded in JSON
router.use(bodyParser.json());

router.post('/withtoken', (req, res) => {
    let email = req.body[JSONconsts.EMAIL];
    let token = req.body[JSONconsts.TOKEN];
    let theirPw = req.body[JSONconsts.PASSWORD];
    if(email && theirPw && token) {
        //Using the 'one' method means that only one row should be returned
        db.one('SELECT MemberID, Password, firstname, lastname, username, verification, Salt FROM Members WHERE Email=$1', [email])
        //If successful, run function passed into .then()
            .then(row => {
                let salt = row[JSONconsts.SALT];
                //Retrieve our copy of the password
                let ourSaltedHash = row[JSONconsts.PASSWORD];


                //Combined their password with our salt, then hash
                let theirSaltedHash = getHash(theirPw, salt);

                //Did our salted hash match their salted hash?
                let wasCorrectPw = ourSaltedHash === theirSaltedHash;

                if (wasCorrectPw) {

                    let firstname = row['firstname'];
                    let lastname = row['lastname'];
                    let id = row[JSONconsts.MYID];
                    let username = row[JSONconsts.MYUN];
                    let verification = row['verification'];
                    userdata = {firstname, lastname, username, id, email, verification};

                    //password and email match. Save the current FB Token
                    let params = [id, token];
                    db.manyOrNone('INSERT INTO FCM_Token (memberId, token) VALUES ($1, $2) ON CONFLICT (memberId) DO UPDATE SET token=$2;', params)
                        .then(row => {
                            res.send({
                                success: true,
                                message: "Token Saved",
                                user:userdata
                            });
                        })
                        .catch(err => {
                            console.log("failed on insert");
                            console.log(err);
                            //If anything happened, it wasn't successful
                            res.send({
                                success: false,
                                message: err
                            });
                        })

                } else {
                    res.send({
                        success: false
                    });
                }

            })
            //More than one row shouldn't be found, since table has constraint on it
            .catch((err) => {
                //If anything happened, it wasn't successful
                res.send({
                    success: false,
                    message: err
                });
            });
    } else {
        res.send({
            success: false,
            message: 'missing credentials'
        });
    }
});


router.post('/', (req, res) => {
    let email = req.body[JSONconsts.EMAIL];
    let theirPw = req.body[JSONconsts.PASSWORD];

    if(email && theirPw) {
        //Using the 'one' method means that only one row should be returned
        db.one('SELECT Password, Salt, firstname, lastname, username, memberid, verification FROM Members WHERE Email=$1', [email])
        //If successful, run function passed into .then()
            .then(row => {
                console.log("success 1");
                let salt = row[JSONconsts.SALT];
                //Retrieve our copy of the password
                let ourSaltedHash = row[JSONconsts.PASSWORD];

                //Combined their password with our salt, then hash
                let theirSaltedHash = getHash(theirPw, salt);

                //Did our salted hash match their salted hash?
                let wasCorrectPw = ourSaltedHash === theirSaltedHash;

                    let firstname = row['firstname'];
                    let lastname = row['lastname'];
                    let id = row[JSONconsts.MYID];
                    let username = row['username'];
                    let verification = row['verification'];
                    userdata = {firstname, lastname, username, id, email, verification};

                //Send whether they had the correct password or not
                res.send({
                    success: wasCorrectPw,
                    user:userdata
                });
            })
            //More than one row shouldn't be found, since table has constraint on it
            .catch((err) => {
                //If anything happened, it wasn't successful
                res.send({
                    success: false,
                    message: err
                });
            });
    } else {
        res.send({
            success: false,
            message: 'missing credentials'
        });
    }
});

module.exports = router;

/*  old queries
'SELECT memberid, firstname, lastname, username, email, verification FROM Members WHERE Email=$1'

 */