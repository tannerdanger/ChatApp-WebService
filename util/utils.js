//Get the connection to Heroku Database
let db = require('./sql_conn.js');


//We use this create the SHA256 hash
const crypto = require("crypto");

function sendEmail(from, receiver, subj, message) {

    var nodemailer = require('nodemailer');
    var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'hoolichat.authenticator@gmail.com',
            pass: 'piedpiper' //YOLO      (burner email I don't care).
        }
    });
    var mainOptions = {
        from: 'hoolichat.authenticator@gmail.com',
        to: receiver,
        subject: subj,
        text: message
    };

    transporter.sendMail(mailOptions, function(error, info){
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });
    //research nodemailer for sending email from node.
    // https://nodemailer.com/about/
    // https://www.w3schools.com/nodejs/nodejs_email.asp
    //create a burner gmail account
    //make sure you add the password to the environmental variables
    //similar to the DATABASE_URL and PHISH_DOT_NET_KEY (later section of the lab)

    //fake sending an email for now. Post a message to logs.

}

function sendVerificationEmail(reciever){
    let url="https://tcss450group6-backend.herokuapp.com/verify?email="+reciever;
    let message = "<strong>Welcome to our app!</strong> <p>Please follow the link below to verify your account!</p> <p>" + url + "</p>"
    sendEmail("", reciever, "Welcome to Hoolichat! Verification Required!", message);

}

/**
 * Method to get a salted hash.
 * We put this in its own method to keep consistency
 * @param {string} pw the password to hash
 * @param {string} salt the salt to use when hashing
 */
function getHash(pw, salt) {
    return crypto.createHash("sha256").update(pw + salt).digest("hex");
}



module.exports = {
    db, getHash, sendEmail
};