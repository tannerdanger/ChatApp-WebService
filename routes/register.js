/**
 * @Author Tanner Brown
 * @type {router}
 * Router for handling user registration.
 */

//express is the framework we're going to use to handle requests
const express = require('express');

//We use this create the SHA256 hash
const crypto = require("crypto");

//Create connection to Heroku Database
let db = require('../util/utils').db;

let getHash = require('../util/utils').getHash;

let sendVerificationEmail = require('../util/utils').sendVerificationEmail;

let sendRecoveryEmail = require('../util/utils').sendRecoveryEmail;

let queries = require('../util/queries').MISC_QUERIES;

let JSONconsts = require('../util/JSON_defs').JSON_CONSTS;

var router = express.Router();

const bodyParser = require("body-parser");
//This allows parsing of the body of POST requests, that are encoded in JSON
router.use(bodyParser.json());


/**
 * Allows a user to recover their password.
 * It sends a recovery code to an email address, and allows that code to be used
 * at the /updatepw endpoint to change the password.
 *
 * Requires: an email address.
 */
router.post('/recover', (req, res) => {

    var email = req.body[JSONconsts.EMAIL];
    var day = new Date();
    var decoder = day.getDay() + 3;
    var code = getHash(JSONconsts.SALTKEY, email);

    console.log(code);

    code = code.toString().substr(decoder,5);
    console.log(decoder);
    console.log("recover code: ", code);

    sendRecoveryEmail(email, code);
    if(null != email)
        res.send({msg:"email sent"});
    else
        res.send({msg:"email failed to send"});
});

/**
 * Uses the unique code sent via email to identify a user, and allow them
 * to change their password.
 *
 * Returns the user's login info.
 */
router.post('/updatepw', (req, res) =>{

    var email = req.body[JSONconsts.EMAIL];
    var incode = req.body[JSONconsts.CODE];
    var pw = req.body[JSONconsts.PASSWORD];


    var day = new Date();
    var decoder = day.getDay() + 3;
    var code = getHash(JSONconsts.SALTKEY, email);


    console.log(code);

    code = code.toString().substr(decoder,5);
    console.log(decoder);
    console.log("recover code: ", code);

    isMatch = (incode.toString()===code.toString());

    if(isMatch){

        let salt = crypto.randomBytes(32).toString("hex");
        let salted_hash = getHash(pw, salt);

        params = [ salted_hash, salt, email];
        db.none(queries.UPDATE_PASSWORD, params)
            .then(() =>{
                db.one('SELECT MemberID, Password, firstname, lastname, username, verification, Salt FROM Members WHERE Email=$1', [email])
                    .then(row => {

                        let firstname = row['firstname'];
                        let lastname = row['lastname'];
                        let id = row[JSONconsts.MYID];
                        let username = row[JSONconsts.MYUN];
                        let verification = row['verification'];

                        userdata = {firstname, lastname, username, id, email, verification};
                        res.send({
                            success: true,
                            user:userdata
                        });


                    }).catch((err) => {
                    res.send({
                        success: false,
                        error: err
                    });
                })
            }).catch((err) => {
            res.send({
                success: false,
                error: err
            });
        })


    }else{
        res.send({
            success: false,
            message: "code did not match"
        });
    }


});

/**
 * Used to verify a user's account. This endpoint should be called directly from a user's email,
 * and not within the app code.
 */
router.get('/verify', (req, res) => {
    let email = req.query[JSONconsts.EMAIL];
    let key = req.query[JSONconsts.KEY];
    console.log("verifying new user: "+email);
    if(getHash(JSONconsts.SALTKEY, email) === key){
        //UPDATE members SET verification = 1 WHERE email = 'test@test.com2';

        db.none(queries.VERIFY_USER_ACCOUNT, email)
            .then(() => {
                //We successfully verified the user, let the user know
                console.log("new user verified");
                res.send({
                    success: true
                });
            }).catch((err) => {
            //log the error
            console.log(err);
            res.send({
                success: false,
                error: err
            });
        });
    } else {
        res.send({
            success: false
        });
    }
});

/**
 * Resends a verification email to a user.
 */
router.post('/resend', (req, res) => {
    var email = req.body[JSONconsts.EMAIL];

    sendVerificationEmail(email, getHash(JSONconsts.SALTKEY, email));

});

/**
 * Endpoint for registering new users.
 */
router.post('/', (req, res) => {
    res.type("application/json");

    //Retrieve data from query params
    var first = req.body['first'];
    var last = req.body['last'];
    var username = req.body[JSONconsts.MYUN];
    var email = req.body[JSONconsts.EMAIL];
    var password = req.body[JSONconsts.PASSWORD];
    //Verify that the caller supplied all the parameters
    //In js, empty strings or null values evaluate to false
    if(first && last && username && email && password) {
        //We're storing salted hashes to make our application more secure
        //If you're interested as to what that is, and why we should use it
        //watch this youtube video: https://www.youtube.com/watch?v=8ZtInClXe1Q
        let salt = crypto.randomBytes(32).toString("hex");
        let salted_hash = getHash(password, salt);

        //Use .none() since no result gets returned from an INSERT in SQL
        //We're using placeholders ($1, $2, $3) in the SQL query string to avoid SQL Injection
        //If you want to read more: https://stackoverflow.com/a/8265319
        let params = [first, last, username, email, salted_hash, salt];
        db.none(queries.INSERT_NEW_MEMBER, params)
            .then(() => {
                //We successfully added the user, let the user know
                res.send({
                    success: true
                });
                sendVerificationEmail(email, getHash(SALTKEY, email));
            }).catch((err) => {
            //log the error
            console.log(err);
            //If we get an error, it most likely means the account already exists
            //Therefore, let the requester know they tried to create an account that already exists
            res.send({
                success: false,
                error: err
            });
        });
    } else {
        res.send({
            success: false,
            input: req.body,
            error: "Missing required user information"
        });
    }
});

module.exports = router;
