/**
    Entry point for android chatapp backend.
    Creates a web server and varous routes.
*/

//express is the framework we're going to use to handle requests
const express = require('express');
const app = express();



/**
    Path routing.
    API:
    POST: /login/
          /login/withtoken

    POST: /messaging/new
          /messaging/newnewmulti
          /messaging/remove
          /messaging/send
          /messaging/getmy
          /messaging/getall

    POST: /conn/search
          /conn/propose
          /conn/remove
          /conn/approve
          /conn/getall

    POST: /weather/current
          /weather/city
          /weather/zip
          /weather/coords

    POST: /register/
          /register/recover
          /register/updatepw
          /register/resend

    GET: /register/verify
 */

// app.use('/params', require('./routes/params.js'));
app.use('/login', require('./routes/login.js'));
app.use('/messaging', require('./routes/messaging.js'));
app.use('/conn', require('./routes/connections.js'));
app.use('/weather', require('./routes/weather.js'));
app.use('/register', require('./routes/register.js'));


/*
 * Return HTML for the / end point.
 * This is a nice location to document your web service API
 * Create a web page in HTML/CSS and have this end point return it.
 * Look up the node module 'fs' ex: require('fs');
 */
app.get("/", (req, res) => {
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.write('<h' + 1 + ' style="color:blue">APP IS ONLINE</h' + 1 + '>');
    // for (i = 1; i < 7; i++) {
    //     //write a response to the client
    //     res.write('<h' + i + ' style="color:blue">Hello World!</h' + i + '>');
    // }
    res.end(); //end the response
});
//

/*
* Heroku will assign a port you can use via the 'PORT' environment variable
* To accesss an environment variable, use process.env.<ENV>
* If there isn't an environment variable, process.env.PORT will be null (or undefined)
* If a value is 'falsy', i.e. null or undefined, javascript will evaluate the rest of the 'or'
* In this case, we assign the port to be 5000 if the PORT variable isn't set
* You can consider 'let port = process.env.PORT || 5000' to be equivalent to:
* let port; = process.env.PORT;
* if(port == null) {port = 5000}
*/
app.listen(process.env.PORT || 5000, () => {
    console.log("Server up and running on port: " + (process.env.PORT || 5000));
});