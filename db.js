//Load module and connect to db (tipo config.inc.php)
var Sequelize = require('sequelize');

var env = process.env.NODE_ENV || 'development';
var sequelize;

if (env === 'production') {
	//true se stai andando su heroku
	sequelize = new Sequelize(process.env.DATABASE_URL, {
		dialect: 'postgres'
	});
} else {
	sequelize = new Sequelize(undefined, undefined, undefined, {
		//logging: false,
		//logging: console.log
		'dialect': 'sqlite',
		'storage': __dirname + '/data/dev-todo-api.sqlite'
	});
}

var db = {};

//Richiama i modelli (le tabelle) di sqlite da file diversi
db.todo = sequelize.import(__dirname + '/models/todo.js');
db.user = sequelize.import(__dirname + '/models/user.js');
db.sequelize = sequelize;
db.Sequelize = Sequelize;


//Questo oggetto db ha i nostri modelli, un'istanza di sequelize, e le librerie di Sequelize
module.exports = db;