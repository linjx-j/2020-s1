/* Copyright 2018, University of Adelaide */

var express = require('express');
var router = express.Router();

var sanitizeHtml = require('sanitize-html');

const crypto = require('crypto');
const uuid = require('uuid/v1');

/* GET Blog Posts. */
router.get('/posts.json', function(req, res, next) {

    //Connect to the database
    req.pool.getConnection( function(err,connection) {
        if (err) { throw err;}

        // Query to retrieve Blog Posts
        var query = "SELECT name AS author, image AS authorImg, date AS date, title AS title, content AS body "+
                    "FROM users INNER JOIN blogposts on blogposts.userid = users.id "+
                    "ORDER BY date DESC LIMIT "+req.query.num;
        connection.query(query, function(err, posts){
            if (err) { console.log(err); posts=[];}

            // Query to check if user logged in
            var query = "SELECT id,admin,username,name,image FROM users WHERE session_id=?";
            connection.query(query, [req.session.id], function(err, users){
                if (err || users.length <= 0) {
                    users=[null];
                }

                // JSON reply with blog posts and user status
                res.json({user:users[0],posts:posts});

            });


        });
    });

});


/* GET User Info. */
router.get('/users.json', function(req, res, next) {

    //Connect to the database
    req.pool.getConnection( function(err,connection) {
        if (err) { throw err;}

        // Query to check if user logged in
        var query = "SELECT id,admin FROM users WHERE session_id=?";
        connection.query(query, [req.session.id], function(err, users){
            if (err || users.length <= 0) {
                // Not logged in
                res.status(401).send();
                return;
            } else if (users[0].admin!==1) {
                // Not an admin user
                res.status(403).send();
                return;
            }

            // Query to retrieve all user info
            var query = "SELECT id,admin,username,name,image FROM users";
            connection.query(query, function(err,users){
                if (err) {
                    // Query failed
                    res.status(405).send();
                } else {
                    // Success!
                    res.json(users);
                }
            });


        });

    });

});


/* Login. */
router.post('/login', function(req, res, next) {

    //Get username and password from POST request
    var password = req.body.password;
    var username = req.body.username;

    //Connect to the database
    req.pool.getConnection( function(err,connection) {
        if (err) { throw err;}

        // Query to get user info
        var query = "SELECT id,admin,username,pwordhash,pwordsalt,name,image,session_id FROM users WHERE username=?";
        connection.query(query, [username], function(err, users){
            if (err || users.length <= 0) {
                // No valid user found
                res.status(401).send();
                return;
            }

            // Hash and salt password
            var hash = crypto.createHash('sha256');
            hash.update(password+users[0].pwordsalt);
            var submittedhash = hash.digest('hex');
            console.log(submittedhash);

            // Check if salted hashes match
            if(users[0].pwordhash===submittedhash){
                // Correct password, store session
                var query = "UPDATE users SET session_id = ? WHERE id = ?";
                connection.query(query, [req.session.id,users[0].id]);
                res.send();
            } else {
                // Wrong password
                res.status(401).send();
            }
        });
    });

});


/* Logout. */
router.post('/logout', function(req, res, next) {

    //Connect to the database
    req.pool.getConnection( function(err,connection) {
        if (err) { throw err;}

        var query = "UPDATE users SET session_id = NULL WHERE session_id = ?";
        connection.query(query, [req.session.id], function(err){
            if (err) {
                res.status(403).send();
            } else {
                res.send();
            }
        });

    });

});

/* Add Post. */
router.post('/newPost', function(req, res, next) {

    //Connect to the database
    req.pool.getConnection( function(err,connection) {
        if (err) { throw err;}

        // Query to check if user logged in
        var query = "SELECT id FROM users WHERE session_id=?";
        connection.query(query, [req.session.id], function(err, users){
            if (err || users.length <= 0) {
                // Not logged in
                res.status(401).send();
                return;
            }

            // Prepare new post
            var id = uuid();
            var author = users[0].id;
            var now = (new Date()).toISOString();
            var datestr = now.slice(0,10)+" "+now.slice(11,19);
            var title =sanitizeHtml(req.body.title);
            var content = sanitizeHtml(req.body.body);

            // Check for empty content
            if(title=="" || content == ""){
                res.status(405).send();
                return;
            }

            // Add post to DB
            var query = "INSERT INTO blogposts (id,userid,date,title,content) VALUES (?,?,?,?,?)";
            connection.query(query, [id, author, datestr, title, content], function(err){
                if (err) {
                    // Error
                    res.status(405).send();
                } else {
                    // OK
                    res.send();
                }
            });

        });

    });
});


module.exports = router;
