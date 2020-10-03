const express = require("express");
const passport = require("passport");
const { v4: uuidv4 } = require("uuid");
const session = require("express-session");
const fs = require("fs");
const cors = require("cors");
const mysqlConnection = require("./connection");
const FileStore = require("session-file-store")(session);

const app = express();
app.options("*", cors());

const PORT = process.env.PORT || 3000;

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested- With, Content-Type, Accept"
  );
  next();
});

app.use(function (req, res, next) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "POST, GET, PATCH, DELETE, OPTIONS"
  );
  next();
});
require("./seller/account/passport-config")(passport);
app.set("view-engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(
  session({
    genid: (req) => {
      return uuidv4();
    },
    store: new FileStore(),
    cookie: { maxAge: 172800000 },
    secret: "keyboard cat",
    resave: false,
    saveUninitialized: true,
  })
);
app.use(passport.initialize());
app.use(passport.session());

app.use("/seller/register", require("./seller/account/register"));

app.use("/seller/login", require("./seller/account/login"));

app.use("/seller/products", require("./seller/products/products"));

app.use("/seller/catogories", require("./seller/catogories/catogories"));

app.use("/seller/store", require("./seller/account/store"));

app.get("/seller/loginstatus", (req, res) => {
  if (req.isAuthenticated()) {
    return res.status(201).json({
      message: { messageBody: "Loginned", status: true, login: true },
    });
  }
  return res.status(500).json({
    message: { messageBody: "Not Loginned", status: false, login: false },
  });
});

app.get("/seller/logout", (req, res) => {
  req.logOut();
  res.json({ message: "succesfull Logggedout", login: false });
});

app.get("/upload", (req, res) => {
  res.render("upload.ejs");
});

function isLogin(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  return res.status(400).json({
    status: false,
    login: false,
    error: { message: "Please Login", code: 103 },
  });
}
function isNotLogin(req, res, next) {
  if (req.isAuthenticated()) {
    return res.status(400).json({
      status: false,
      login: true,
      error: { message: "Already Loginned", code: 104 },
    });
  }
  return next();
}

app.listen(PORT);
