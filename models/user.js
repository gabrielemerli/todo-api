var bcrypt = require('bcrypt');
var _ = require('underscore');


module.exports = function(sequelize, DataTypes) {
	return sequelize.define('user', {
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
		}
	});
}