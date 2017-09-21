/**
 * Example Node.JS Application
 * Shows just how easy node can be.
 */

/* Install Node.JS and NPM
 * On Ubuntu:

     sudo apt-get update -y --force-yes -qq
	   sudo apt-get install -y --force-yes -qq python-software-properties > /dev/null 2>&1
	   sudo add-apt-repository -y ppa:chris-lea/node.js > /dev/null 2>&1
	   sudo apt-get update -y --force-yes -qq
	   sudo apt-get install -y --force-yes -qq nodejs > /dev/null 2>&1
 
 * On Mac:

       brew install node

 * Install via Package Manager: https://github.com/joyent/node/wiki/Installing-Node.js-via-package-manager
 * Install via source: https://github.com/joyent/node/wiki/Installation
 */


/* Install Server Dependencies:
 * Navigate to the server.js directory and issue command: 
       
       npm install express

 * Navigate to the server.js directory and issue command: 
       
       node server.js
 
 */

// Require express module (http://expressjs.com/) and create an express application server.
var express = require('express');
var app = module.exports = express();
 
// Setup express.
app.use(express.cookieParser());  // Setup express: enable cookies.
app.use(express.bodyParser());    // Setup express: enable body parsing.
app.use(app.router);  	  	  // Use the router to hanldle your application routes below.

// You can uncomment this to use an express session and help secure your communication over SSL.
//app.use(express.session({secret: "notagoodsecretnoreallydontusethisone",cookie: {httpOnly: true, secure: true},}));

// Setup a route that matches the following url: http://localhost:3000/
app.get("/", function (req, res, next) {
  
  // Respond to the request with hello.
  res.send("hello");
});

// Setup a route that matches the following urls: http://localhost:3000/api/ and anything after this.
app.get("/api/*", function(req, res, next) {

  // Respond to the request with a JSON object.
  res.send({ status: 200, response: "Hello"});
});

// Start listening on port 3000 on localhost
app.listen(3000, "localhost");
console.log("[ OK ] Listening on port 3000");
