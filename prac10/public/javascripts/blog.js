/* Copyright 2018, University of Adelaide */

/* AJAX Load Blog Posts */
function loadPosts(){
    
    console.log("Load Post Data");
    
    var xhttp = new XMLHttpRequest();
    
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            var data = JSON.parse(this.responseText);
            
            // Show user options if logged in
            if (data.user !== null) {
                $( '.anon' ).hide();
                $( '.user' ).show();
                if (data.user.admin === 1) {
                    $( '.admin' ).show();
                }
            }
            
            // Clear old posts
            $( 'section.post' ).remove();
            
            // Display new posts
            for (var i=0; i<data.posts.length; i++) {
                $( '#posts' ).append(renderPost(data.posts[i]));
            }
        }
    };
    
    var numposts = $( '#numposts' ).val();
    xhttp.open("GET", "/posts.json?num="+numposts, true);
    xhttp.send();

}

/* AJAX Submit New Blog Post */
function submitPost(){
    
    console.log("Submit Post");
    
    var xhttp = new XMLHttpRequest();
    
    xhttp.onreadystatechange = function() {
        if (this.readyState == 2 && this.status == 200) {
            
            // Post Successful, redirect to home
            $( '#status' ).text("Blog Post Successful...");
            
            window.location.pathname = "/";
            
        } else if (this.readyState == 2 && this.status == 401) {
            
            // Not logged in
            $( '#status' ).text("Please log in.");
            
            window.location.pathname = "/login.html";
            
        } else if (this.readyState == 2 && this.status >= 400) {
            
            // Error
            $( '#status' ).text("Error Adding Blog Post.");
            
        }
    };
    
    var blogPost = { title:$( '#postTitle' ).val(),
                     body: $( '#postBody'  ).val()  };
                     
    xhttp.open("POST", "/newPost", true);
    xhttp.setRequestHeader("Content-type", "application/json");
    xhttp.send(JSON.stringify(blogPost));

}

/* AJAX Login */
function login(){
    
    console.log("Login");
    
    var xhttp = new XMLHttpRequest();
    
    xhttp.onreadystatechange = function() {
        if (this.readyState == 2 && this.status == 200) {
            
            // Login Successful, redirect to URL paramter "target"
            $( '#status' ).text("Login Successful...");
            
            window.location.pathname = findGetParameter("target");
            
        } else if (this.readyState == 2 && this.status >= 400) {
            
            // Login Failed
            $( '#status' ).text("Login Failed.");
            
        }
    };
    
    var credentials = { username:$( '#uname' ).val(),
                        password:$( '#pword' ).val()  };
    xhttp.open("POST", "/login", true);
    xhttp.setRequestHeader("Content-type", "application/json");
    xhttp.send(JSON.stringify(credentials));

}

/* AJAX Logout */
function logout(){
    
    console.log("Logout");
    
    var xhttp = new XMLHttpRequest();
    
    xhttp.onreadystatechange = function() {
        if (this.readyState == 2 && this.status == 200) {
            
            // Logout Successful, redirect to home
            window.location.pathname = "/";
            
        }
    };
    
    xhttp.open("POST", "/logout", true);
    xhttp.send();

}

/* AJAX List Users */
function showUsers(){
    
    console.log("Load User Data");
    
    var xhttp = new XMLHttpRequest();
    
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            var users = JSON.parse(this.responseText);
                        
            // Clear old table entries
            $( 'tr.user' ).remove();
            
            // Display current entries
            for (var i=0; i<users.length; i++) {
                
                var id = users[i].id;
                var admin = 'user';
                if(users[i].admin===1){
                    admin='admin';
                }
                var uname = users[i].username;
                var name = users[i].name;
                var img = users[i].image;
                
                var tr = $('<tr class="user"></tr>');                
                var td = $('<td></td>').text(id);

                tr.append(td);
                tr.append(td.clone().text(admin));
                tr.append(td.clone().text(uname));
                tr.append(td.clone().text(name));
                tr.append(td.clone().text(img));
                
                console.log(tr.html());
                
                $( '#users tbody' ).append(tr);
            }
            
        } else if (this.readyState == 2 && this.status == 401) {
            
            // Not logged in
            $( '#status' ).text("Please log in. Redirecting...");
            
            window.location.pathname = "/login.html";
            
        } else if (this.readyState == 2 && this.status == 403) {
            
            // Not an admin user
            $( '#status' ).text("Unauthorised. Redirecting...");
            
            window.location.pathname = "/";
            
        }
    };
    
    xhttp.open("GET", "/users.json", true);
    xhttp.send();

}

/* Build Blog Post HTML */
function renderPost(postData){
    
    var postStructure = '<section class="post">\n'+
                '    <header class="post-header">\n'+
                '        <img width="48" height="48" alt="" class="post-avatar" src="">\n'+

                '        <h2 class="post-title"></h2>\n'+

                '        <p class="post-meta">\n'+
                '            By <a class="post-author" href="#"></a> on <span class="post-date"></span>\n'+
                '        </p>\n'+
                '    </header>\n'+

                '    <div class="post-body"><p></p></div>\n'+
                '</section>';
    var post = $( postStructure );
    
    post.find('img.post-avatar').attr('src', postData.authorImg);
    post.find('img.post-avatar').attr('alt', postData.author   );
    post.find('a.post-author'  ).text(       postData.author   );
    post.find('span.post-date' ).text((new Date(postData.date+"Z")).toLocaleString());
    post.find('h2.post-title'  ).html(       postData.title    );
    post.find('div.post-body p').html(       postData.body     );
    
    return(post);
    
}

/* Pull GET params from URL */
function findGetParameter(parameterName) {
    var result = "";
    var tmp = [];
    location.search
        .substr(1)
        .split("&")
        .forEach(function (item) {
          tmp = item.split("=");
          if (tmp[0] === parameterName) result = decodeURIComponent(tmp[1]);
        });
    return result;
}

