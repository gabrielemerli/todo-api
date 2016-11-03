
var express = require('express');
var app = express();
var PORT = process.env.PORT || 3000;

//Questo array simula un database (che useremo fra un po)
//Collection
var todos = [{
	id: 1,
	description: 'Mett mom for launch',
	completed: false
}, {
	//Model
	id: 2,
	description: 'Vai al cesso a cagare',
	completed: false

},{
	id: 3,
	description: 'Ricordati di santificare le feste',
	completed: true
}];


app.get('/', function(req,res) {
	res.send('TODO API Root');
});

//GET /todos
//Voglio che se accedo col browser a /todo si veda tutto quel che c'è nell'array todos
app.get('/todos',function(req,res){
	//Potrei metterte rs.send JSON.stringify(todos) visto che prende solo stringe in response
	//Però visto che è comunissimo esportare oggetti js c'è un metodo specifico che lo fa
	res.json(todos);
})

//GET /todos/id -> questo :idAttivita è la variabile req.params.idAttivita.
app.get('/todos/:idAttivita', function (req,res){

	//req.params.idAttivita è sempre una stringa
	var todoId = parseInt(req.params.idAttivita, 10);
	var matchedTodo;

	todos.forEach(function (todo) {
		if (todoId === todo.id) {
			matchedTodo = todo;
		}
	});

	//Undefined == false, quindi qui viene eseguito se c'è il match
	if (matchedTodo) {
		res.json(matchedTodo);
	} else {
		res.status(404).send();
		//res.send('ABC');
	}

	/*Io l'ho fatto così
	if ( todoId >= 1 && todoId <= todos.length ) {
		res.send(todos[todoId-1]);
	} else {
		//Non c'è l'id 
		res.status(404).send();
		//res.send('Il signore è il mio pastore, con lui non manco di nulla');

	}	
	*/
});

app.listen(PORT, function() {
	console.log("Express listening on port "+PORT);
})