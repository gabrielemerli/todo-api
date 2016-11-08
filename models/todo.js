//Funzione speciale, gli viene passata una istanzza di sequelize e i datatypes (Sequelize)
module.exports = function(sequelize, DataTypes) {

	return sequelize.define('todo', {
		description: {
			type: DataTypes.STRING,
			//Ora mettiamo un po di validation
			allowNull: false,
			validate: {
				//Valida solo se la dimenzione della stringa è > 1 e minore di 250
				len: [1, 250]
			}
		},
		completed: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: false		
		}
	});

};