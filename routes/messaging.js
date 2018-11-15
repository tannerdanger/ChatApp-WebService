/**
 * Tanner Brown
 * @type {router}
 * Router for handling user messaging.
 */

//express is the framework we're going to use to handle requests
const express = require('express');

//Create connection to Heroku Database
let db = require('../util/utils').db;

var router = express.Router();

const bodyParser = require("body-parser");
//This allows parsing of the body of POST requests, that are encoded in JSON
router.use(bodyParser.json());

let fcm_functions = require('../util/utils').fcm_functions;
let queries = require('../util/queries').MESSAGING_QUERIES;
/**
 * Tested working 9/nov
 *  requires params:
 *
 "sender_id": the sender's memberid,
 "sender_username":"the senders username",
 "recipient_id":the recipient's memberid,
 "recipient_username":"the recipient's username,"
 */
router.post("/new", (req, res) =>{
    //TODO: pass in member id
    //TODO: check if users exist
    //TODO: check if users are connected
    //TODO: check if users currently have a connection

    let sender_id = req.body["sender_id"];
    let sender_username = req.body["sender_username"];
    let recipient_id = req.body["recipient_id"];
    let recipient_username = req.body["recipient_username"];


    if( sender_id && recipient_id && sender_username && recipient_username ) {

        let chatName = sender_username + ", " + recipient_username;

        //insert into table chats
        db.none(queries.CREATE_CHATROOM, chatName)
            .then(() => {
                //get chatid from that chat
                db.one(queries.GET_CHATID_BY_NAME, chatName)
                //if successful
                    .then(rows => {
                        chatID = rows["chatid"];
                        //insert into table chatmembers
                        console.log("Got here 1, chatID:" +chatID + "|  recipientid:"+recipient_id +"|  senderID:"+sender_id) ;
                        let params = [chatID, recipient_id, chatID, sender_id];
                        db.none(queries.ADD_MEMBERS_TO_CHATROOM, params)
                        //if successful
                            .then(() => {
                                //We successfully created a chat and all tables properly updated
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

                    }).catch((err) => {
                    //log the error
                    console.log(err);
                    res.send({
                        success: false,
                        error: err
                    });
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
            success: false,
            input: req.body,
            error: "Missing required user information"
        });
    }
});

//send a message to all users "in" the chat session with chatId
router.post("/send", (req, res) => {
    let email = req.body['email'];
    let message = req.body['message'];
    let chatId = req.body['chatId'];

    if(!email || !message || !chatId) {
        res.send({
            success: false,
            error: "Username, message, or chatId not supplied"
        });
        return;
    }
    //add the message to the database

    db.none(queries.INSERT_MESSAGE, [chatId, message, email])
        .then(() => {
            //send a notification of this message to ALL members with registered tokens
            db.manyOrNone(queries.GET_ALL_TOKENS_IN_A_CHAT)
                .then(rows => {
                    rows.forEach(element => {
                        fcm_functions.sendToIndividual(element['token'], message, email);
                    });
                    res.send({
                        success: true
                    });
                }).catch((err) => {
                    console.log("Location 1 - error: "+err);
                res.send({
                    success: false,
                    error: err,
                    msg: "message sent but Firebase Token doesn't exist. User will not recieve notification"
                });
            })
        }).catch((err) => {
        console.log("Location 2 - error: "+err);
        res.send({
            success: false,
            error: err,
        });
    });
});


router.post("/getmy", (req, res) => {
    let memberid = req.body['memberid'];
    db.manyOrNone(queries.GET_ALL_CHATS_BY_MEMBERID, memberid)
        .then((rows) => {
            res.send({
                chats: rows
            })
        }).catch((err) => {
            res.send({
                success:false,
                error: err
            })

    });
});

//Get all of the messages from a chat session with id chatid
router.post("/getall", (req, res) => {
    let chatId = req.body['chatId'];

    db.manyOrNone(queries.GET_ALL_MESSAGES_BY_CHATID, [chatId])
        .then((rows) => {
            res.send({
                messages: rows
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
 OLD QUERIES FOR SAVING

  insert = `INSERT INTO Messages(ChatId, Message, MemberId)
                SELECT $1, $2, MemberId FROM Members
                WHERE email=$3`;

insertchats = `INSERT into chats(name) VALUES($1)`;
insertchatmembers = `INSERT into chatmembers(chatid, memberid) VALUES($1, $2),($3, $4)`;
selectchatID = `SELECT chatid FROM chats WHERE name =$1`;
retrieveUser = `SELECT * from members where memberid = $1`;

 //getall
 query = `SELECT Members.Email, Messages.Message, Members.memberid,
 to_char(Messages.Timestamp AT TIME ZONE 'PDT', 'YYYY-MM-DD HH24:MI:SS.US' ) AS Timestamp
 FROM Messages
 INNER JOIN Members ON Messages.MemberId=Members.MemberId
 WHERE ChatId=$1
 ORDER BY Timestamp DESC`;
 */