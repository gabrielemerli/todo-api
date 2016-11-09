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
		password: {
			type: DataTypes.STRING,
			allowNull: false,
			validate: {
				len: [5,100]
			}
		}

	} , {
		//Aggiuingo un hook
		hooks: {
			beforeValidate: function (user,options) {
				//user.email ---> To lowercase
				if (typeof user.email === 'string') {
					user.email = user.email.trim().toLowerCase();
				}
			}
		}
	});
}