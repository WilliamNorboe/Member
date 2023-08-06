/////// app.js

const express = require("express");
const path = require("path");
const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const bcrypt = require('bcryptjs');

const mongoDb = "mongodb+srv://wdnorboe:1234@cluster0.iyvnigz.mongodb.net/?retryWrites=true&w=majority";
mongoose.connect(mongoDb, { useUnifiedTopology: true, useNewUrlParser: true });
const db = mongoose.connection;
db.on("error", console.error.bind(console, "mongo connection error"));

const User = mongoose.model(
  "User",
  new Schema({
    username: { type: String, required: true },
    password: { type: String, required: true },
    firstname: { type: String, required: true },
    lastname: { type: String, required: true },
    membership: { type: Boolean, required: true }
  })
);

const Message = mongoose.model(
  "Message",
  new Schema({
    text: { type: String, required: true },
    date: { type: Date, required: true },
    author: { type: String, required: true },
  })
);

const Messages = mongoose.model(
  "Messages",
  new Schema({
    text: { type: String, required: true },
    date: { type: Date, required: true },
    author: { type: String, required: true },
  })
);

passport.serializeUser(function(user, done) {
    done(null, user.id);
  });
  
  passport.deserializeUser(async function(id, done) {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch(err) {
      done(err);
    };
  });

const app = express();
app.set("views", __dirname);
app.set("view engine", "ejs");

passport.use(
    new LocalStrategy(async(username, password, done) => {
      try {
        const user = await User.findOne({ username: username });
        if (!user) {
          return done(null, false, { message: "Incorrect username" });
        };
        if (user.password !== password) {
          return done(null, false, { message: "Incorrect password" });
        };
        return done(null, user);
      } catch(err) {
        return done(err);
      };
    })
  );

app.use(session({ secret: "cats", resave: false, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.urlencoded({ extended: false }));
app.use(function(req, res, next) {
    res.locals.currentUser = req.user;
    Message.find({}, ).then((r)=>{
      var userMap = [];
      let i = 0;
      r.forEach(function(user) {
        userMap[i] = user;
        i++;
      });
      res.locals.messages = userMap;
      next();
    });
    next();
  });

app.get("/", (req, res) => {
    res.render("index", { user: req.user });
  });
app.get("/sign-up", (req, res) => res.render("sign-up-form"));
app.get("/join", (req, res) => res.render("join-the-club"));
app.get("/create", (req, res) => res.render("create-message"));


app.post("/sign-up", async (req, res, next) => {
    let te = await User.exists({username: req.body.username}); // user already exists
    if(te != null){
      res.redirect('/sign-up');
      return;
    }
    try {
      const user = new User({
        username: req.body.username,
        password: req.body.password,
        firstname: req.body.firstname,
        lastname: req.body.lastname,
        membership: false
      });
      const result = await user.save();
      res.redirect("/");
    } catch(err) {
      return next(err);
    };
  });

  app.post("/create", async (req, res, next) => {
    console.log(req.user.username);
    try {
      const message = new Message({
        text: req.body.content,
        date: new Date(),
        author: req.user.username
      });
      const result = await message.save();
      res.redirect("/");
    } catch(err) {
      return next(err);
    };
  });

  app.post("/join", async (req, res, next) => {

    if(req.body.secret == "11037"){
      const filter = { _id: req.user._id };
      const update = { membership: true };
      let doc = await User.findOneAndUpdate(filter, update);
      res.redirect("/");
    }
    else{
      res.redirect("/join");
    }
    

    return;
  });

  app.post(
    "/log-in",
    passport.authenticate("local", {
      successRedirect: "/",
      failureRedirect: "/"
    })
  );

  app.get("/log-out", (req, res, next) => {
    req.logout(function (err) {
      if (err) {
        return next(err);
      }
      res.redirect("/");
    });
  });

app.listen(3000, () => console.log("app listening on port 3000!"));