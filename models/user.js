var bcrypt = require('bcrypt');
var _ = require('underscore');


module.exports = function(sequelize, DataTypes) {
	var user = sequelize.define('user', {
		email: {
			type: DataTypes.STRING,
			allowNull: false,
			unique: true,
			validate: {
				isEmail: true
			}
		},
		salt: {
			type: DataTypes.STRING
		},
		password_hash: {
			type: DataTypes.STRING
		},
		password: {
			//http://docs.sequelizejs.com/en/latest/api/datatypes/#virtual
			//Per la cifratura metto la password virtual, così non viene memorizzata in db ma è comunque accessibile
			type: DataTypes.VIRTUAL,
			allowNull: false,
			validate: {
				len: [5, 100]
			},
			//Viene chiamata passando il valore dell'oggetto (password in questo caso)
			set: function(value) {
				var salt = bcrypt.genSaltSync(10);
				var hashedPassword = bcrypt.hashSync(value, salt);

				this.setDataValue('password', value);
				this.setDataValue('salt', salt);
				this.setDataValue('password_hash', hashedPassword);
			}
		}

	}, {
		//Aggiuingo un hook
		hooks: {
			beforeValidate: function(user, options) {
				//user.email ---> To lowercase
				if (typeof user.email === 'string') {
					user.email = user.email.trim().toLowerCase();
				}
			}
		},
		//Aggiungo un metodo per non mostrare alcuni dati privati di ritorno
		instanceMethods: {
			toPublicJSON: function() {
				//this è l'istance
				var json = this.toJSON();
				return _.pick(json, 'id', 'email', 'updatedAt', 'createdAt');
			}
		},
		classMethods: {
			authenticate: function(body) {
				return new Promise(function(resolve, reject) {

					if ((typeof body.email !== 'string') || (typeof body.password !== 'string')) {
						return reject();
					}

					//res.status(200).json(body);

					//Cerco l'utente il cui indirizzo email è quello che mi arriva in post
					user.findOne({
						where: {
							email: body.email
						}
					}).then(function(user) {
						//User è un oggetto json, non un array perchè findOne ne trova SEMPRE uno (o zero)
						if (!user || !bcrypt.compareSync(body.password, user.password_hash)) {
							//Lui fa così, con il .get if (!user || !bcrypt.compareSync(body.password,user.get('password_hash'))) {
							//SE non lo trovo (fermo l'esecuzione, perchè non uso else e quindi mi devo fermare)
							//Oppure se la password non è quella buona
							//401 -> l'autenticazione è possibile ma fallisce
							return reject();
						}
						//Se lo trovo e la password è quella buona devo creare un token di autenticazione
						resolve(user);

					}, function(e) {
						//In caso di errore
						reject();
					});
				});
			}

		}
	});
	return user;
};