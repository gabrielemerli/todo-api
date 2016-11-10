var bcrypt = require('bcrypt');
var _ = require('underscore');
var cryptojs = require('crypto-js');
var jwt = require('jsonwebtoken');


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
			},
			generateToken: function(type) {
				//Se va male ritorno undefined, se va bene ritorno il token
				if (!_.isString(type)) {
					return undefined;
				}

				//Creo il token, uniqe e encrypted
				try {
					//IL token altro non è che l'oggetto contenente l'id della persona e la tipologia di token, cifrato con aes
					var stringData = JSON.stringify({id: this.get('id'), type: type});
					var encryptedData =  cryptojs.AES.encrypt(stringData, '@+abc#123!').toString();

					//Questa funzione di nuovo cifra e ha bisogno di una chiave
					var token = jwt.sign({
						token: encryptedData
					},'loPlo01.89@');
					return token;
					

				} catch (e) {
					console.error(e);
					return (undefined)
				}


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
			} ,
			findByToken: function (token) {
				return new Promise(function (resolve, reject) {
					
					try{
						//Decode the token
						var decodedJWT = jwt.verify(token,'loPlo01.89@');
						//Decrypt the data in the token
						var bytes = cryptojs.AES.decrypt(decodedJWT.token, '@+abc#123!');
						//Ora converto quest bytes in un oggetto json
						var tokenData = JSON.parse(bytes.toString(cryptojs.enc.Utf8));

						user.findById(tokenData.id).then(function(user) {
							if (user) {
								resolve(user);
							} else {
								//Rejecto se l'id non c'è nel database
								reject();
							}
						}, function (e) {
							//Rejecto se findbyid fallisce, tipo se il db non è connesso correttamente
							reject();
						});
					}catch (e) {
						//Rejecto se try e catch fallisce, tipo se il token non ha un formato valido
						reject();
					}
				});
			}

		}
	});
	return user;
};