//Load module and connect to db (tipo config.inc.php)
var Sequelize = require('sequelize');
//Nuova istanza di sequelize (classe -> oggetto)
var sequelize = new Sequelize(undefined, undefined, undefined, {
	'dialect': 'sqlite',
	'storage': __dirname + '/data/dev-todo-api.sqlite'
});

var db = {};

//Richiama i modelli (le tabelle) di sqlite da file diversi
db.todo = sequelize.import(__dirname + '/models/todo.js');
db.sequelize = sequelize;
db.Sequelize = Sequelize;


//Questo oggetto db ha i nostri modelli, un'istanza di sequelize, e le librerie di Sequelize
module.exports = db;