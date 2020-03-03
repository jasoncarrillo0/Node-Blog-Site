// Setup express app and universals
const dotenv              = require("dotenv");
const express             = require("express");
const bodyParser          = require("body-parser");
const ejs                 = require("ejs");
const app                 = express();
const _                   = require("lodash");
const mongoose            = require("mongoose");
dotenv.config();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));


// DB Setup ---------------------------------------------------------------
const connectionString = "mongodb+srv://admin-jason:" + process.env.PASSWORD + "@cluster0-mbyxu.mongodb.net/blogDB"
mongoose.connect(connectionString, { 
  useNewUrlParser: true, 
  useUnifiedTopology: true, 
  useFindAndModify: false,
  socketTimeoutMS: 0,
});
const postSchema = {
  blog_heading: String,
  blog_body: String,
  blog_url: String
};
const Post                = mongoose.model("Post", postSchema);
const homeStartingContent = new Post({blog_heading: "Home", blog_body: "This blog site is built using Node.js on the back-end and basic web technologies on the front-end. It is also responsive. Go ahead and create a blog post under 'Compose'."});
const aboutContent        = new Post({blog_heading: "About", blog_body: "This responsive blog site was created using Node.js, embedded JavaScript, and basic web technologies (HTML/CSS, Bootstrap). All blog posts are kept on a database using Mongoose and MongoDB."});
const contactContent      = new Post({blog_heading: "Contact", blog_body: "Please contact me through my linked in profile, at https://www.linkedin.com/in/jason-carrillo/"});
const defaultPosts        = [homeStartingContent, aboutContent, contactContent];


// HOME ROUTING ----------------------------------------------------------------
app.get("/", function(req, res) {  
  Post.find({}, function(e, foundItems) { 
    if (e) {
        alert("There was an error loading the database. Contact the Administrator.");
        console.log(e);
    }
    // if nothing is in foundItems, create a new collection by inserting something into Item schema
    else if (foundItems.length === 0) {
        Post.insertMany(defaultPosts, function(err) {
            if (err) {
                console.log(err);
            } else {
                console.log("Added default posts.\n");
            }
        });
        res.render('home', {posts: foundItems, homeHeading: homeStartingContent.blog_heading, homeBody: homeStartingContent.blog_body});
    }
    else {
      res.render('home', {posts: foundItems, homeHeading: homeStartingContent.blog_heading, homeBody: homeStartingContent.blog_body}); // pass all items found in collection
    }
  });
});



// COMPOSE ROUTING ----------------------------------------------------------------
app.get("/compose", function(req, res) {
  res.render('compose');
});

app.post("/compose", function(req, res) {
  Post.find({}, function (e, foundItems) {
    console.log(foundItems);
    if (e) {
      console.log(e);
    }
    else if (!postHeadingUsed(foundItems, req.body.postHeading)) {
      // make title case for headings
      let userHeading      = titleCase(req.body.postHeading);
      userHeading          = userHeading.trim();
      const userHeadingUrl = userHeading.replace(/ /g, "-");
      // add post Object
      const post = new Post({blog_heading: userHeading, blog_body: req.body.postBody, blog_url: userHeadingUrl})
      // save it to DB
      post.save();
    }
    else {
      console.log("Post Heading already used. Please choose another.");
    }
    res.redirect("/");
  });
});


// POST ROUTING ----------------------------------------------------------------
app.get("/posts/:postHeading", function(req, res) {
  //remove snake casing to compare to search for it in postHeadingVals array
  let url_postHeading   = req.params.postHeading.replace(/-/g, ' ');
  Post.find({}, function(e, foundItems) {
    if (postHeadingUsed(foundItems, url_postHeading)) {
      const newIndex = foundItems.findIndex(obj => obj.blog_heading === url_postHeading);
      res.render('post', {postObj: foundItems[newIndex]});
    }
    else {
      console.log(url_postHeading + " was not found. Contact the administrator.");
    }
  });
});


// ABOUT AND CONTACT ROUTING ----------------------------------------------------------------
app.get("/about", function(req, res) {
  res.render('about', {aboutHeading: aboutContent.blog_heading, aboutBody: aboutContent.blog_body});
});

app.get("/contact", function(req, res) {
  res.render('contact', {contactHeading: contactContent.blog_heading, contactBody: contactContent.blog_body});
});



// FUNCTIONS -------------------------------------------------------------------

// returns first letter capitalized of every word in string 
function titleCase(str) {
  var splitStr = str.toLowerCase().split(' ');
  for (var i = 0; i < splitStr.length; i++) {
      // Assign it back to the array
      splitStr[i] = splitStr[i].charAt(0).toUpperCase() + splitStr[i].substring(1);     
  }
  // Directly return the joined string
  return splitStr.join(' '); 
}


function postHeadingUsed(arr, postHeading) {
  for (const obj of arr) {
    if (obj.blog_heading === postHeading) {
      return true;
    }
  }
  return false;
}


// listen on Heroku defined PORT variable
let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}
app.listen(port);