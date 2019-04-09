const express = require('express');
const cookieSession = require('cookie-session');
const bodyParser = require('body-parser');
const passportSetup = require('./config/passport-setup');
const passport = require('passport');

const keys = require('./config/keys');
const sql = require('./config/sql');

const publicRoot = '../vue-client/dist';

const app = express();

app.use(express.static(publicRoot))
app.use(bodyParser.json())

app.use(cookieSession({  
  keys: keys.session.cookieKeys,
  maxAge: 24 * 60 * 60 * 1000
}))

app.use(passport.initialize());
app.use(passport.session());

app.get("/", (req, res, next) => {
  res.sendFile("index.html", { root: publicRoot})
})

app.get("/login", (req, res, next) => {  
  passport.authenticate("steam", (err, profile, info) => {
    if (err) {
      return next(err);
    }

    if (!profile) {
      return res.status(400).send([profile, "Cannot log in", info]);
    }

    req.login(profile, err => {
      res.send("Logged in");
    });
  })(req, res, next);
});

app.get("/return", (req, res, next) => {  
  passport.authenticate("steam", (err, profile, info) => {
    if (err) {
      return next(err);
    }

    if (!profile) {
      return res.status(400).send([profile, "Cannot log in", info]);
    }

    req.login(profile, err => {
      res.redirect("/");
    });
  })(req, res, next);
});

app.get("/logout", function(req, res) {  
  req.logout();
  res.redirect("/");
});

app.get("/api/user", function(req, res) {
  if(req.isAuthenticated()) {
    res.send({user: req.session.passport.user});
  } else {
    res.send({user: false});
  }
});

app.get("/api/stats", function(req, res) {
  sql.execute(sql.topKills, []).then((kills) => {
    sql.execute(sql.topDeaths, []).then((deaths) => {
      sql.execute(sql.topWins, []).then((wins) => {
        sql.execute(sql.topLosses, []).then((losses) => {
          res.send({statistics: { kills: kills, deaths: deaths, wins: wins, losses: losses}});
        })
      })
    })
  })
});

app.listen(3000, () => {  
  console.log("ggv app listening on port 3000")
})