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
let JSONconsts = require('../util/JSON_defs').JSON_CONSTS;

router.post("/new", (req, res ) => {
    let sender_id = req.body[JSONconsts.MYID];
    let sender_username = req.body[JSONconsts.MYUN];
    let recipient_id = req.body[JSONconsts.THERID];
    let recipient_username = req.body[JSONconsts.THEIRUN];
    var id_a, id_b, name_a, name_b;

    if( sender_id && recipient_id && sender_username && recipient_username ) {
        console.log("success 1");
        //sort id's so it is consistent
        if(sender_id < recipient_id){
            id_a = sender_id;
            name_a = sender_username;
            id_b = recipient_id;
            name_b = recipient_username;
        } else {
            id_a = recipient_id;
            name_a = recipient_username;
            id_b = sender_id;
            name_b = sender_username;
        }
        var loc = "location 1";
        let chatName = name_a + ", " + name_b;
        db.one(queries.CREATE_CHATROOM_NOT_EXISTS, chatName) //create chat
            .then((rows) => {
                console.log(loc);
                db.one(queries.GET_CHATID_BY_NAME, chatName)
                    .then((data) => {
                        loc = "location 2";
                        console.log(loc);
                        // res.send({
                        //     loc: "location 1",
                        //     data: data['chatid']
                        // })
                        let params = [data['chatid'], id_a];
                        db.oneOrNone(queries.ADD_MEMBER_TO_CHAT, params)
                            .then((data) => {
                                res.send({
                                    loc: loc,
                                    chatid: data['chatid']
                                });
                            }).catch((err) =>{
                            let params = [data['chatid'], id_b];

                            db.oneOrNone(queries.ADD_MEMBER_TO_CHAT, params)
                                .then((data) => {
                                    res.send({
                                        loc: "loc 6",
                                        chatid: data['chatid']
                                    });
                                }).catch((err) =>{

                            });

                            res.send({
                                loc: "location 5",
                                chatid: data['chatid'],
                                error: err
                            })
                        });

                    }).catch((err) =>{
                    loc = loc + " catch";
                    console.log(loc);
                    res.send({
                        loc: loc,
                        data: err
                    })
                });
                // res.send({
                //     loc: "location 1",
                //     data: rows
                // })
            }).catch((err) =>{ //chat exists, return chatid
            loc = loc + " catch";
            console.log(loc);
            db.one(queries.GET_CHATID_BY_NAME, chatName)
                .then((data) => {
                    loc = loc + "_1";
                    res.send({
                        exists: true,
                        chatid: data['chatid'],
                        loc: loc
                    })
                });
        });
    }
});

/**
 * Tested working 9/nov
 *  requires params:
 *
 "sender_id": the sender's memberid,
 "sender_username":"the senders username",
 "recipient_id":the recipient's memberid,
 "recipient_username":"the recipient's username,"
 */
router.post("/oldnew", (req, res) =>{
    //TODO: pass in member id
    //TODO: check if users exist
    //TODO: check if users are connected
    //TODO: check if users currently have a connection

    let sender_id = req.body[JSONconsts.MYID];
    let sender_username = req.body[JSONconsts.MYUN];
    let recipient_id = req.body[JSONconsts.THERID];
    let recipient_username = req.body[JSONconsts.THEIRUN];
    var id_a, id_b, name_a, name_b;


    if( sender_id && recipient_id && sender_username && recipient_username ) {
        console.log("success 1");
        //sort id's so it is consistent
        if(sender_id < recipient_id){
            id_a = sender_id;
            name_a = sender_username;
            id_b = recipient_id;
            name_b = recipient_username;
        } else {
            id_a = recipient_id;
            name_a = recipient_username;
            id_b = sender_id;
            name_b = sender_username;
        }
        let chatName = name_a + ", " + name_b;


        //insert into table chats
        db.none(queries.CREATE_CHATROOM_NOT_EXISTS, chatName) //create chat
            .then(() => {
                console.log("success 2");
                //get chatid from that chat
                db.one(queries.GET_CHATID_BY_NAME, chatName) //get chat id
                //if successful
                    .then(rows => {

                        chatID = rows[JSONconsts.CHAT];
                        //insert into table chatmembers
                        console.log("Success 3, chatID:" +chatID + "|  id_a:"+id_a +"|  id_b:"+id_b) ;
                        let params = [chatID, id_a];//, chatID, id_b];
                        //db.none(queries.ADD_MEMBERS_TO_CHATROOM, params)
                        db.none(queries.ADD_MEMBER_TO_CHAT, params) //add first member to chat
                        //if successful
                            .then(() => {
                                //We successfully created a chat and all tables properly updated
                                // res.send({
                                //     success: true,
                                //     chatid: chatID
                                // });

                            }).catch((err) => {
                            //log the error
                            console.log(err);

                            res.send({
                                success: false,
                                error: err
                            });
                        });
                        params = [chatID, id_b];
                        db.none(queries.ADD_MEMBER_TO_CHAT, params)
                        //if successful
                            .then(() => {
                                // We successfully created a chat and all tables properly updated
                                res.send({
                                    success: true,
                                    chatid: chatID
                                });

                            }).catch((err) => {
                            //log the error
                            console.log(err);

                            res.send({
                                chatid: chatid,
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
            console.log("error at 1");
            db.one(`SELECT chatid FROM chats WHERE name = $1`, chatName)
                .then((data) => {
                    res.send({
                        exists:true,
                        chatid: data
                    })
                }).catch((err) => {
                console.log("error at 2");
                res.send({
                    success: false,
                    chatid: chats,
                    error: err
                })
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
    let email = req.body[JSONconsts.EMAIL];
    let username = req.body[JSONconsts.MYUN];
    let message = req.body[JSONconsts.MSG];
    let chatId = req.body[JSONconsts.CHAT];

    if(null != username){email = username;}


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
            db.manyOrNone(queries.GET_ALL_TOKENS_IN_A_CHAT, chatId)
                .then(rows => {
                    rows.forEach(element => {
                        fcm_functions.sendToIndividual(element[JSONconsts.TOKEN], message, email, chatId);
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
    let memberid = req.body[JSONconsts.MYID];
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
    let chatId = req.body[JSONconsts.CHAT];

    db.manyOrNone(queries.GET_ALL_MESSAGES_BY_CHATID, [chatId])
        .then((rows) => {
            res.send({
                chatid: chatId,
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