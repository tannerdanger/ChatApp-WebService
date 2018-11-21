var admin = require("firebase-admin");

var serviceAccount = require("./tcss450-hoolichat-firebase-adminsdk-datue-35e03d5310");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://tcss450-hoolichat.firebaseio.com"
});

//use to send message to all clients register to the Topoic (ALL)
function sendToTopic(msg, from, topic) {

    //build the message for FCM to send
    var message = {

        notification: {
            title: 'New Message from '.concat(from),
            body: msg,

        },
        data: {
            "type": "msg",
            "sender": from,
            "message": msg,
        },
        "topic": topic
    };

    console.log(message);

    // Send a message to the device corresponding to the provided
    // registration token.
    admin.messaging().send(message)
        .then((response) => {
            // Response is a message ID string.
            console.log('Successfully sent message:', response);

        })
        .catch((error) => {
            console.log('Error sending message:', error);
        });
}

//send notifications
function sendConnectionRequest(token, fromID, fromName){

    var message = {
        android: {
            notification: {
                title: 'New Connection Request',
                body: fromName + ' wants to connect with you.',
                icon: '@drawable/ic_notification_phish',
                color: "#0000FF",
            },
            data:{
                "type": "connection_req",
                "sender": fromID.toString()
            }
        },
        "token": token
    };
    console.log(message);

    admin.messaging().send(message)
        .then((response) => {
            console.log('Successfully sent message:', response);
        })
        .catch((error) => {
            console.log('Error sending message:', error);
        });

}

//use to send message to a specific client by the token
function sendToIndividual(token, msg, from, chatid) {

    //build the message for FCM to send
    var message = {
        android: {
            notification: {
                title: 'New Message from '.concat(from),
                body: msg,
                color: "#0000FF",
                icon: '@drawable/ic_notification_phish'
            },
            data: {
                "type": "msg",
                "sender": from,
                "message": msg,
                "chatid":chatid.toString(),
            }
        },
        "token": token
    };
    console.log(message);

    // Send a message to the device corresponding to the provided
    // registration token.
    admin.messaging().send(message)
        .then((response) => {
            // Response is a message ID string.
            console.log('Successfully sent message:', response);

        })
        .catch((error) => {
            console.log('Error sending message:', error);
        });
}


let fcm_functions = { sendToTopic, sendToIndividual, sendConnectionRequest };

module.exports = {
    admin, fcm_functions
};