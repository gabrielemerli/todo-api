var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var PORT = process.env.PORT || 3000;
var _ = require('underscore');
var db = require('./db.js');
var bcrypt = require('bcrypt');
//L'auth token nelle singole richieste dei todoitem va passato (A MANO) nell'header in postman
var middleware = require('./middleware.js')(db);

// Questo array simula un database (che useremo fra un po)
var todos = [];
//Serve per incrementare l'id delle attività che andremo a inserire tramite le api
var todoNextId = 1;

//Ogni volta che arriva una richiesta json, express ne farà il parsing
app.use(bodyParser.json());


app.get('/', function(req, res) {
	res.send('TODO API Root');
});

//GET /todos?completed=true
app.get('/todos', middleware.requireAuthentication, function(req, res) {

	//Ora vogliamo gestire anche i valory in querystring, per esempio
	// todos?key=value&a=b&completed=true
	//Nel nostro caso ci interessano le attività che ancora non sono state completate
	// todos?completed=false
	//NOTA i parametri che arrivano son sempre STRINGHE anche se l'oggetto completed è un booleano
	var query = req.query;
	var where = {};
	var todoToPrint = [];

	//Seleziono solo quelli il cui id è della persona loggata
	where.userId = req.user.get('id');


	//Se in query string c'è il parametro completed...
	if (query.hasOwnProperty('completed') && query.completed === 'true') {
		where.completed = true;

	} else if (query.hasOwnProperty('completed') && query.completed === 'false') {
		where.completed = false;

	}

	//Se im query string c'è il parametro q
	if (query.hasOwnProperty('q') && query.q.length > 0) {
		where.description = {
			$like: '%' + query.q + '%'
		};
	}



	db.todo.findAll({
		where: where
	}).then(function(todos) {
			//Se l'array dei risultati è > 0
			if (todos.length > 0) {
				res.json(todos)
			} else {
				res.status(404).send();
			}
		},
		function(e) {
			res.status(500).send();
		});


	/*
		//Se non ci sono parametri
		db.todo.findAll({
			where: {
				completed: where.completed
			}
		}).then(function(todos) {
			if (todos) {
				todos.forEach(function(todo) {
					todoToPrint.push(todo.toJSON());
				});
				res.json(todoToPrint);
			} else {
				res.status(404).send();
			}

		}, function(error) {
			res.status(500).send();
		});
	*/
});



//GET /todos/id
app.get('/todos/:idAttivita', middleware.requireAuthentication, function(req, res) {

	var todoId = parseInt(req.params.idAttivita, 10);

	//db.todo.findById(todoId).then(function(todo) {
	//Cerco solo quielli appartenenti allo user id
	db.todo.findOne({
		where: {
			userId: req.user.get('id'),
			id: todoId
		}
	}).then(function(todo) {
		//todo non è un boolean, o è un oggetto o è null, per cui !! lo converte in un boolean (vero o falso)
		if (!!todo) {
			res.json(todo.toJSON());
		} else {
			//400 -> not found
			res.status(404).send();
		}

	}, function(error) {
		//500 -> Internal server error
		res.status(500).send();

	});
});


// POST /todos
app.post('/todos', middleware.requireAuthentication, function(req, res) {

	//_pick prende solo i valori dell'oggetto che corrispondono a, così se uno mi passa campi oltre a description e value li elimino
	var body = _.pick(req.body, 'description', 'completed');

	/*
	//Facciamo un po' di validation
	if (!_.isBoolean(body.completed) || !_.isString(body.description) || body.description.trim().length === 0) {
		//Se fallisce ritorniamo così non esegue altro codice
		//e mandiamo di ritorno il codice 400, ovvero non posso procedere perchè i dati sono malformati
		//.send() mandiamo dopo il 400 un corpo vuoto
		return res.status(400).send();
	}
	*/

	db.todo.create({
		description: body.description.trim(),
		completed: body.completed
	}).then(function(todo) {
		//TUTTO OK
		//req.user c'è perchè è stato definito nel middleware		/Questo crea l'associazione
		req.user.addTodo(todo).then(function() {
			//Faccio un reload del todo perchè il todo che ora è referenziato non ha l'associazione che abbiamo appena aggiunto.
			return todo.reload();
		}).then(function(todo) {
			res.json(todo.toJSON());
		});
		//res.json(todo.toJSON());
		//O anche res.json(body), ma così ritorna solo description e completed poi non vedo l'id e created updated
	}, function(e) {
		//Problemi, 400 -> dati malformati
		res.status(400).json(e)
	});

});


// DELETE /todos/:id
app.delete('/todos/:idAttivita', middleware.requireAuthentication, function(req, res) {

	var todoId = parseInt(req.params.idAttivita, 10);

	//Destroy ritorna nella promessa un integer col numero delle righe distrutte, NON un'istanza dell'oggetto distrutto (o oggetti)

	db.todo.destroy({
		where: {
			id: todoId,
			userId: req.user.get('id')
		}
	}).then(function(destroy) {
		if (destroy > 0) {
			//200 -> tutto ok,ma dei dati mi arrivano indietro
			//204 -> Tutto ok, e non ti spettare niente di ritorno
			res.status(204).send();
		} else {
			//res.status(404).send();
			res.status(404).json({
				error: 'No todo with id'
			});
		}

	}, function(e) {
		res.status(500).send();
	});


	var matchedTodo = _.findWhere(todos, {
		id: todoId
	});

});

//Update a todoitem
// PUT /todos/:id
app.put('/todos/:idAttivita', middleware.requireAuthentication, function(req, res) {

	var todoId = parseInt(req.params.idAttivita, 10);

	var body = _.pick(req.body, 'description', 'completed');
	var attributes = {};

	/*
	NB:
	La validazione NON funzione

	https://github.com/chriso/validator.js/blob/master/README.md
	http://docs.sequelizejs.com/en/latest/docs/models-definition/
	o meglio, funziona ma solo sulle stringhe e solo se nel modello c'è
	
	validate: {
				//Valida solo se la dimenzione della stringa è > 1 e minore di 250
				len: [1, 250]
			}

	di base per dire sqlite non ha un tipizzazione (strict types) e memorizza tutto come stringa.

	*/

	//Se ciò che mi arriva ha il campo completed e se completed è un boolean => Aggiorno
	if (body.hasOwnProperty('completed')) {
		attributes.completed = body.completed;
	} else {
		//Never provided attribute allora non faccio una sega
	}


	//Stessa cosa ma con la descrizione che è una stringa
	if (body.hasOwnProperty('description')) {
		attributes.description = body.description;
	} else {
		//Never provided attribute allora non faccio una sega
	}


	//Uso un istance method, ovvero un metodo da lanciare su una istanza risultato di una ricerca
	//db.todo.findById(todoId).then(function(todo) {
	//Cerco solo quielli appartenenti allo user id
	db.todo.findOne({
		where: {
			userId: req.user.get('id'),
			id: todoId
		}
	}).then(function(todo) {
		if (todo) {
			return todo.update(attributes).then(function(todo) {
				//Successo,ha trovato qualcosa (vien lanciato da return todo.update(attributes) sull'oggetto fetchato)
				res.json(todo.toJSON());
			}, function(error) {
				res.status(400).json(error);
				//console.log("viva la lega");
			});
		} else {
			res.status(404).send();
		}
	}, function() {
		res.status(500).send();
	});


	/*
		db.todo.update(attributes, {
			where: {
				id: todoId
			}
		}).then(function(arUpdate) {
			if (arUpdate[0] > 0) {
				res.status(204).send();
			} else {
				res.status(404).send();
			}
		}, function(e) {
			res.status(500).json(e);
		});
		*/
});



//POST /users
app.post('/users', function(req, res) {

	//_pick prende solo i valori dell'oggetto che corrispondono a, così se uno mi passa campi oltre a description e value li elimino
	var body = _.pick(req.body, 'email', 'password');

	/*
	//Facciamo un po' di validation
	if (!_.isBoolean(body.completed) || !_.isString(body.description) || body.description.trim().length === 0) {
		//Se fallisce ritorniamo così non esegue altro codice
		//e mandiamo di ritorno il codice 400, ovvero non posso procedere perchè i dati sono malformati
		//.send() mandiamo dopo il 400 un corpo vuoto
		return res.status(400).send();
	}
	*/

	db.user.create(body).then(function(user) {
		//TUTTO OK		
		res.json(user.toPublicJSON());
	}, function(e) {
		//Problemi, 400 -> dati malformati
		res.status(400).json(e)
	});

});


////////////////////FUNZIONE DI LOGIN DI UTENTI CREATI////////////////////////////////
//POST /users/login
app.post('/users/login', function(req, res) {

	//_pick prende solo i valori dell'oggetto che corrispondono a, così se uno mi passa campi oltre a description e value li elimino
	var body = _.pick(req.body, 'email', 'password');

	//Al posto del codice qui sotto scrivo una funzione/metodo/oggetto che mi faccia l'autentica
	db.user.authenticate(body).then(function(userObj) {
		//Se va bene
		//Nell'header metto la voce Auth, con valore il risultato dell'instance method lanciato sullo userObj.
		//L'instance method genererà un token di tipo authentication
		var token = userObj.generateToken('authentication');
		if (token) {
			res.header('Auth', token).json(userObj.toPublicJSON());
		} else {
			//Se qualcosa va a male nel generare il token
			res.status(401).send();
		}

	}, function() {
		//Se va male
		//L'utente non esiste, la password è sbagliata
		//Con l'autentica mandiamo un messaggio scarno apposta senza spiegare cosa succede
		res.status(401).send();

	});

});



db.sequelize.sync({
	force: true,
	logging: console.log
}).then(function() {

	//Qui dentro facciamo partire il server, dopo aver inizializzato il db
	app.listen(PORT, function() {
		console.log("Express listening on port " + PORT);
	})

});