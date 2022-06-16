const express = require("express");
const router = express.Router();
const db = require("./db");
const { signupValidation, loginValidation } = require("./validation");
const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
var fs = require("fs");
const xmlsize = 436;

router.post("/register", signupValidation, (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).send({
      error: "Nie poprawne dane.",
    });
  }

  db.query(
    "SELECT * FROM users WHERE email = '" + req.body.email + "'",
    (err, result) => {
      if (result.length === 1) {
        return res.status(409).send({
          msg: "Ten uzytkownik istnieje!",
        });
      } else {
        bcrypt.hash(req.body.password, 10, (err, hash) => {
          if (err) {
            return res.status(500).send({
              error: err,
            });
          } else {
            db.query(
              `INSERT INTO users (name, email, password) VALUES ('${
                req.body.name
              }', ${db.escape(req.body.email)}, ${db.escape(hash)})`,
              (err, result) => {
                if (err) {
                  return res.status(400).send({
                    error: err,
                  });
                }
                return res.status(201).send({
                  msg: "Poprawnie zarejestrowano!",
                });
              }
            );
          }
        });
      }
    }
  );
});

router.post("/login", loginValidation, (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).send({
      error: "Nie poprawne dane.",
    });
  }
  db.query(
    "SELECT * FROM users WHERE email = '" + req.body.email + "'",
    (err, result) => {
      if (err) {
        return res.status(400).send({
          msg: err,
        });
      }
      if (!result.length) {
        return res.status(401).send({
          error: "Niepoprawne dane!",
        });
      }

      bcrypt.compare(
        req.body.password,
        result[0]["password"],
        (bErr, bResult) => {
          if (bErr) {
            return res.status(401).send({
              error: "Niepoprawne dane!",
            });
          }
          if (bResult) {
            const token = jwt.sign(
              { id: result[0].id },
              "the-super-strong-secrect",
              { expiresIn: "1h" }
            );
            db.query(
              `UPDATE users SET last_login = now() WHERE id = '${result[0].id}'`
            );
            return res.status(200).send({
              msg: "Zalogowano!",
              token,
              user: result[0],
            });
          }
          return res.status(401).send({
            msg: "Niepoprawne dane!",
          });
        }
      );
    }
  );
});

var obj = [];
var json = JSON.stringify(obj);

fs.writeFile("wynikidane.json", json, "utf8", function (err) {
  if (err) throw err;
});

fs.writeFile(
  "wynikidane.xml",
  '<?xml version="1.0" encoding="UTF-8" ?>',
  "utf8",
  function (err) {
    if (err) throw err;
  }
);

router.get("/pobierzjson", function (req, res) {
  const data = require("./danejson.json");
  var tab_szczepienia = [];
  var tab_zgony = [];

  db.query("DROP TABLE IF EXISTS szczepienia", function (err, result) {
    if (err) throw err;
    console.log("Table deleted");
  });

  db.query("DROP TABLE IF EXISTS zgony", function (err, result) {
    if (err) throw err;
    console.log("Table deleted");
  });

  db.query(
    "CREATE TABLE szczepienia (id INT(10) NOT NULL AUTO_INCREMENT, data date, liczba_szczepien INT(10), PRIMARY KEY (id))",
    function (err, result) {
      if (err) throw err;
      console.log("Table created");
    }
  );

  db.query(
    "CREATE TABLE zgony (id INT(10) NOT NULL AUTO_INCREMENT, data date, ilosc_zgonow INT(10), PRIMARY KEY (id))",
    function (err, result) {
      if (err) throw err;
      console.log("Table created");
    }
  );

  for (var i = 0; i < data.length; i++)
    tab_szczepienia.push([data[i].data, data[i].liczba_szczepien]);

  for (var i = 0; i < data.length; i++)
    tab_zgony.push([data[i].data, data[i].ilosc_zgonow]);

  db.query(
    "INSERT INTO szczepienia (data, liczba_szczepien) VALUES ?",
    [tab_szczepienia],
    function (err, result) {
      if (err) {
        res.send(err);
      } else {
        db.query(
          "INSERT INTO zgony (data, ilosc_zgonow) VALUES ?",
          [tab_zgony],
          function (err, result) {
            if (err) {
              res.send(err);
            } else {
              res.send("Dodano dane za pomoca formatu JSON");
            }
          }
        );
      }
    }
  );
});

router.get("/pobierzxml", function (req, res) {
  const xmlFile = fs.readFileSync("danexml.xml", "utf-8");
  var tab_szczepienia = [];
  var tab_zgony = [];

  for (var i = 0; i <= xmlsize; i++) {
    var glowne_dane = xmlFile.substring(
      xmlFile.indexOf("<" + i + ">") + 3,
      xmlFile.lastIndexOf("</" + i + ">")
    );

    var data = glowne_dane.substring(
      glowne_dane.indexOf("<data>") + 6,
      glowne_dane.lastIndexOf("</data>")
    );

    var szczepienia = glowne_dane.substring(
      glowne_dane.indexOf("<liczba_szczepien>") + 18,
      glowne_dane.lastIndexOf("</liczba_szczepien>")
    );

    var zgony = glowne_dane.substring(
      glowne_dane.indexOf("<ilosc_zgonow>") + 14,
      glowne_dane.lastIndexOf("</ilosc_zgonow>")
    );

    tab_szczepienia.push([data, szczepienia]);
    tab_zgony.push([data, zgony]);
  }

  db.query("DROP TABLE IF EXISTS szczepienia", function (err, result) {
    if (err) throw err;
    console.log("Table deleted");
  });

  db.query("DROP TABLE IF EXISTS zgony", function (err, result) {
    if (err) throw err;
    console.log("Table deleted");
  });

  db.query(
    "CREATE TABLE szczepienia (data date, liczba_szczepien INT(10))",
    function (err, result) {
      if (err) throw err;
      console.log("Table created");
    }
  );

  db.query(
    "CREATE TABLE zgony (data date, ilosc_zgonow INT(10))",
    function (err, result) {
      if (err) throw err;
      console.log("Table created");
    }
  );

  db.query(
    "INSERT INTO szczepienia (data, liczba_szczepien) VALUES ?",
    [tab_szczepienia],
    function (err, result) {
      if (err) {
        res.send(err);
      } else {
        db.query(
          "INSERT INTO zgony (data, ilosc_zgonow) VALUES ?",
          [tab_zgony],
          function (err, result) {
            if (err) {
              res.send(err);
            } else {
              res.send("Dodano dane za pomoca formatu XML");
            }
          }
        );
      }
    }
  );
});

router.post("/obliczjson", function (req, res) {
  var data = req.body;
  var poczatek = data.poczatek;
  var koniec = data.koniec;

  var l_szczepien = 0;
  var l_zgonow = 0;

  db.query(
    "SELECT data, liczba_szczepien FROM szczepienia WHERE data > '" +
      poczatek +
      "' AND data < '" +
      koniec +
      "'",
    function (err, result) {
      if (err) {
        res.send(err);
      } else {
        for (var i = 0; i < result.length; i++) {
          l_szczepien += result[i].liczba_szczepien;
        }
      }
    }
  );

  db.query(
    "SELECT data, ilosc_zgonow FROM zgony WHERE data > '" +
      poczatek +
      "' AND data < '" +
      koniec +
      "'",
    function (err, result) {
      if (err) {
        res.send(err);
      } else {
        for (var j = 0; j < result.length; j++) {
          l_zgonow += result[j].ilosc_zgonow;
        }
      }
      res.send(
        "W okresie od " +
          poczatek +
          " do " +
          koniec +
          " wykonano " +
          l_szczepien +
          " szczepien, zmarlo " +
          l_zgonow +
          " zaszczepionych osób."
      );
      fs.readFile(
        "wynikidane.json",
        "utf8",
        function readFileCallback(err, data) {
          if (err) {
            console.log(err);
          } else {
            obj = JSON.parse(data);
            obj.push({
              data_poczatkowa: poczatek,
              data_koncowa: koniec,
              wykonano_szczepien: l_szczepien,
              zmarlo: l_zgonow,
            });
            json = JSON.stringify(obj);
            fs.writeFile("wynikidane.json", json, "utf8", function (err) {
              if (err) throw err;
            });
          }
        }
      );
    }
  );
});

router.get("/zapiszxml", function (req, res) {
  fs.readFile(
    "wynikidane.json",
    "utf8",
    function readFileCallback(err, wyniki) {
      if (err) {
        console.log(err);
      } else {
        fs.readFile(
          "wynikidane.xml",
          "utf8",
          function readFileCallback(err, data) {
            if (err) {
              console.log(err);
            } else {
              wyniki = JSON.parse(wyniki);
              let ndane = '<?xml version="1.0" encoding="UTF-8" ?>';
              ndane += "<root>";
              for (let i = 0; i < wyniki.length; i++) {
                ndane += "<row><data_poczatkowa>";
                ndane += wyniki[i].data_poczatkowa;
                ndane += "</data_poczatkowa><data_koncowa>";
                ndane += wyniki[i].data_koncowa;
                ndane += "</data_koncowa><wykonano_szczepien>";
                ndane += wyniki[i].wykonano_szczepien;
                ndane += "</wykonano_szczepien><zmarlo>";
                ndane += wyniki[i].zmarlo;
                ndane += "</zmarlo></row>";
              }
              ndane += "</root>";
              fs.writeFile("wynikidane.xml", ndane, "utf8", function (err) {
                if (err) throw err;
              });
            }
          }
        );
      }
    }
  );

  res.send("Poprawnie zapisano wynik w formacie XML");
});

router.get("/pobierzWyniki", function (req, res) {
  fs.readFile("wynikidane.json", "utf8", function readFileCallback(err, data) {
    if (err) {
      console.log(err);
    } else {
      res.json(data);
    }
  });
});

module.exports = router;
