var mysql = require("mysql");

var connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "node_project",
});

connection.connect(function (err) {
  if (err) throw err;
  else {
    console.log("Connected to MySQL");
  }
});

module.exports = connection;
