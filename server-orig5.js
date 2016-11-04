
var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var PORT = process.env.PORT || 3000;
var _ = require('underscore');

//Questo array simula un database (che useremo fra un po)
var todos = [];
//Serve per incrementare l'id delle attività che andremo a inserire tramite le api
var todoNextId = 1;

//Ogni volta che arriva una richiesta json, express ne farà il parsing
app.use(bodyParser.json());


app.get('/', function(req,res) {
	res.send('TODO API Root');
});

//GET /todos
app.get('/todos',function(req,res){
	res.json(todos);
})

//GET /todos/id
app.get('/todos/:idAttivita', function (req,res){

	var todoId = parseInt(req.params.idAttivita, 10);
	var matchedTodo = _.findWhere(todos, {id: todoId})

	if (matchedTodo) {
		res.json(matchedTodo);
	} else {
		res.status(404).send();
	}

});


// POST /todos
app.post('/todos', function(req,res) {

	//_pick prende solo i valori dell'oggetto che corrispondono a, così se uno mi passa campi oltre a description e value li elimino
	var body = _.pick(req.body, 'description', 'completed');

	//Facciamo un po' di validation
	if( !_.isBoolean(body.completed) || !_.isString(body.description) || body.description.trim().length === 0 ){
		//Se fallisce ritorniamo così non esegue altro codice
		//e mandiamo di ritorno il codice 400, ovvero non posso procedere perchè i dati sono malformati
		//.send() mandiamo dopo il 400 un corpo vuoto
		return res.status(400).send();
	}

	body.id=todoNextId;
	todoNextId++;
	body.description = body.description.trim();
	todos.push(body);

	res.json(body);
});


// DELETE /todos/:id
app.delete('/todos/:idAttivita', function(req,res) {

	var todoId = parseInt(req.params.idAttivita, 10);
	var matchedTodo = _.findWhere(todos, {id: todoId})

	if (!matchedTodo) {
		//Se non c'è l'i da eliminare
		res.status(404).json({"Error": "no todo found with that id"});
	} else {
		todos = _.without(todos,matchedTodo);
		//Di default il .json manda il il codice 200, tutto ok
		res.json(matchedTodo);
	}	

	
});

//Update a todoitem
// PUT /todos/:id
app.put('/todos/:idAttivita', function(req,res) {

	var todoId = parseInt(req.params.idAttivita, 10);
	var matchedTodo = _.findWhere(todos, {id: todoId})

		var body = _.pick(req.body, 'description', 'completed');
		var validAttributes = {};

		if (!matchedTodo) {
			return res.status(404).send();
			//se l'id fornito non corrispodne a nessun todo item memorizzato
			//404 -> Not found
		}

		//Se ciò che mi arriva ha il campo completed e se completed è un boolean => Aggiorno
		if (body.hasOwnProperty('completed') && _.isBoolean(body.completed)) {
			validAttributes.completed = body.completed;
		} else if (body.hasOwnProperty('completed')) {
			//Se invece mi forniscono un campo ma non è un boleano (quindi non è valido)
			//400 -> Bad syntax
			return res.status(400).send();
		} else {
			//Never provided attribute allora non faccio una sega
		}


		//Stessa cosa ma con la descrizione che è una stringa
		if (body.hasOwnProperty('description') && _.isString(body.description) && body.description.trim().length > 0) {
			validAttributes.description = body.description;
		} else if (body.hasOwnProperty('description')) {			
			return res.status(400).send();
		} else {
			//Never provided attribute allora non faccio una sega
		}

		//Uso il metodo extend
		//Shallowly copy all of the properties in the source objects over to the destination object, and return the destination object
		matchedTodo = _.extend(matchedTodo, validAttributes);
		//Funziona perchè in js quando passi un oggetto a una funzione viene passato il reference per cui se lo aggiorni, aggiorna
		//L'oggetto originale, non la copia...adesso me lodice vabbè

		res.json(matchedTodo);

});



app.listen(PORT, function() {
	console.log("Express listening on port "+PORT);
})