/**
 * Tanner Brown
 * @type {router}
 * Router for handling user to user connections.
 */


//express is the framework we're going to use to handle requests
const express = require('express');

//Create connection to Heroku Database
let db = require('../util/utils').db;

var router = express.Router();

const bodyParser = require("body-parser");
//This allows parsing of the body of POST requests, that are encoded in JSON
router.use(bodyParser.json());

let queries = require('../util/queries').CONNECTION_QUERIES;

/**
 * User's info comes in body, search query comes in URI params.
 * Tested OK.
 */
router.post("/search", (req, res) => {

    var isMatch = false;
    var memberid = req.body['memberid'];
    let searchquery = req.query['query'];

    //first, search for unique
    db.one(queries.FIND_UNIQUE_CONTACT, [memberid, searchquery])
        .then(data => {

            if(data != null ){
                console.log("Match found by username");
                res.send({
                    success: true,
                    data: data
                });
            } else {

            }
        }).catch((err) => {
        //if unique match not found, check to make sure the length of the query is 4+ characters, then search by that
        if (searchquery.toString().length < 4) {
            res.send({
                success: false,
                data: "Search parameters too small. Try searching with more than 3 characters."
            });
        } else {
            console.log("No unique, searching for " + searchquery + " by similar matches");
            searchquery = '%' + searchquery + '%';

            db.manyOrNone(queries.FIND_CONTACT_BYREST, [memberid, searchquery])
                .then(data => {
                    if (null != data && null != data[0]) {
                        console.log("Match found by query");
                        res.send({
                            success: true,
                            data: data
                        });
                    } else {
                        res.send({
                            success: false,
                            data: "No matches for: '" + searchquery + "' found!"
                        });
                    }
                }).catch((err) => {
                //log the error
                console.log(err);
                res.send({
                    success: false,
                    data: "No matches for: '" + searchquery + "' found!"
                });
            });
        }
    });
});

/**
 * Adds a friend request to the database. Checks to ensure an existing request doesn't exist.
 */
router.post("/propose", (req, res) => {

    var sender = req.body['sender_id'];
    var target = req.body['recipient_id'];

    db.none(queries.PROPOSE_CONNECTION, [sender, target])
        .then(() => {
            res.send({
                success:true
            });
        }).catch((err)=>{
        res.send({
            success:false,
            error: err
        });
    })
});

router.post("/approve", (req, res) => {

    var sender = req.body['sender_id'];
    var target = req.body['recipient_id'];
    db.none(queries.ACCEPT_CONNECTION, [sender, target])
        .then(() => {
            res.send({
                success:true
            });
        }).catch((err)=>{
        res.send({
            success:false,
            error: err
        });
    })

});

/**
 * Returns all connections from the user with the given id.
 * Returns accepted and unaccepted requests, which are identified as "verified".
 */
router.post("/getall", (req, res) => {
    let memberID = req.body['sender_id'];
    db.manyOrNone(queries.GET_ALL_CONTACTS, [memberID])
        .then((rows) => {
            res.send({
                connections: rows
            })
        }).catch((err) => {
        res.send({
            success: false,
            error: err
        })
    });
});

module.exports = router;

/**
    OLD QUERIES


 const QUERY_PROPOSE = `INSERT INTO contacts(memberid_a, memberid_b) SELECT $1, $2
 WHERE NOT EXISTS(
 SELECT memberid_a, memberid_b
 FROM contacts
 WHERE memberid_a = $1 and memberid_b = $2
 OR memberid_a = $2 and memberid_b = $1
 );`;

 const QUERY_ACCEPT = `UPDATE contacts SET verified = 1
 WHERE verified = 0
 AND (memberid_a = $1 AND "memberid_b" = $2)
 OR (memberid_a = $2 AND memberid_b = $1);`;
 const QUERY_PROPOSE = `INSERT INTO contacts(memberid_a, memberid_b) SELECT $1, $2 WHERE NOT EXISTS(SELECT );`;
 const QUERY_FINDUNIQUE = `SELECT memberid, firstname, lastname, username, email FROM members where username~*$1 OR email~*$1;`;

 const QUERY_FINDBYREST = `SELECT memberid, firstname, lastname, username, email FROM members WHERE firstname ilike $1
 OR lastname ilike $1
 OR username ilike  $1`;

 const QUERY_ALLCONTACTS = `SELECT Members.email, Members.memberid, Members.firstname, Members.lastname, Members.username, Contacts.verified
 FROM Members
 INNER JOIN Contacts
 ON (Members.MemberID = Contacts.memberid_a AND Contacts.memberid_b = $1)
 OR (Members.MemberID = Contacts.memberid_b AND Contacts.memberid_a = $1);`;


 */