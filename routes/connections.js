/**
 * @Author Tanner Brown
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

let queries = require('../util/queries').ALL_QUERIES;
let JSONconsts = require('../util/JSON_defs').JSON_CONSTS;
let fcm_functions = require('../util/utils').fcm_functions;

/**
 * User's info comes in body, search query comes in URI params.
 * Tested OK.
 */
router.post("/search", (req, res) => {


    var memberid = req.body[JSONconsts.MYID];
    let searchquery = req.query[JSONconsts.QUERY];

    console.log(memberid);
    console.log(searchquery);
    //first, search for unique
    db.one(queries.FIND_UNIQUE_CONTACT, [memberid, searchquery])
        .then((data) => {
            console.log("Found unique user:\n", data);

            res.send({
                success: true,
                user: data
            });

        }).catch((err) => {
        //match not found
        //searchquery = "%" + searchquery + "%";

        if (searchquery.toString().length < 4) {
            res.send({
                success:false,
                msg:"Search Query Too Short"
            });
        }else {

            console.log(searchquery);
            db.many(queries.FIND_CONTACT_BYREST, [memberid, searchquery])
                .then((data) => {
                    res.send({
                        success: true,
                        user: data
                    });
                }).catch((err) => {
                res.send({
                    success: false,
                    msg: "no user found"
                });
            });
        }
    });
});


/**
 * Adds a friend request to the database. Checks to ensure an existing request doesn't exist.
 */
router.post("/propose", (req, res) => {

    var sender = req.body[JSONconsts.MYID];
    var senderName = req.body[JSONconsts.MYUN];
    var target = req.body[JSONconsts.THERID];
    var member_a, member_b;
    if (sender < target){
        member_a = sender;
        member_b = target
    }else{
        member_a = target;
        member_b = sender;
    }

    console.log("sender:" + sender + " senderName: " + senderName + " targetID: " + target);

    db.none(queries.PROPOSE_CONNECTION, [member_a, member_b, sender])
        .then(() => {
            console.log("location 1 success");
            db.one(queries.GET_FB_TOKEN_BY_ID, target)
                .then(data => {
                    console.log("location 2 success");
                    console.log("TOken: " + data['token']);
                    fcm_functions.sendConnectionRequest(data['token'], sender, senderName); //notify user of friend request
                    res.send({
                        success:true
                    });
                }).catch(err =>{
                console.log("error: ", err);
                res.send({
                    success:true,
                    msg:"request sent but user not notified.",
                    err: err
                });

            });
        }).catch((err)=>{
        res.send({
            success:false,
            error: err
        });
    })
});

/**
 * Deletes a friend from the database, along with all mutual chatrooms.
 */
router.post("/remove", (req, res) => {

    var sender = req.body[JSONconsts.MYID];
    var target = req.body[JSONconsts.THERID];
    var chatid = req.body[JSONconsts.CHAT];

    db.task('remove chat', t => {
        return t.batch([

            t.any(queries.REMOVE_CHATMEMBERS_BY_CHATID, chatid),
            t.any(queries.REMOVE_CHATS_BY_CHATID, chatid),
            t.any(queries.REMOVE_CONNECTION, [sender, target])
        ]);
    }).then(data => {
        res.send(data)
    }).catch(err => {
        res.send(err)
    });
});

/**
 * Approves a friend request.
 */
router.post("/approve", (req, res) => {

    var sender = req.body[JSONconsts.MYID];
    var target = req.body[JSONconsts.THERID];
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
    let memberID = req.body[JSONconsts.MYID];
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