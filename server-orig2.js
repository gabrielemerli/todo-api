
var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var PORT = process.env.PORT || 3000;


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

//GET /todos/id -> questo :idAttivita è la variabile req.params.idAttivita.
app.get('/todos/:idAttivita', function (req,res){

	var todoId = parseInt(req.params.idAttivita, 10);
	var matchedTodo;

	todos.forEach(function (todo) {
		if (todoId === todo.id) {
			matchedTodo = todo;
		}
	});

	if (matchedTodo) {
		res.json(matchedTodo);
	} else {
		res.status(404).send();
	}

});


//POST /todos (l'id viene creato automaticamente,ovviamente)
//Qui mi serve il modulo body-parser
app.post('/todos', function(req,res) {
	var body = req.body;

	//Aggiungo al body che richiedo alla pagina l'id e lo incremento di 1
	body.id=todoNextId;
	todoNextId++;
	//Aggiungo all'array todos il body (che comprende l'id e il json in post che gli mando)
	todos.push(body);
	//console.log(todos);
	//console.log('description '+body.description);
	res.json(body);
});


app.listen(PORT, function() {
	console.log("Express listening on port "+PORT);
})