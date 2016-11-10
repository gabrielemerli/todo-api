//Questo viene eseguito prima delle route regolari, quindi devo sapere che rotta regolare poi verrà usata (next)
module.exports = function (db) {

	return {
		requireAuthentication: function (req, res, next) {
			var token = req.get('Auth');
			//Cerco lo user dal token
			db.user.findByToken(token).then(function (user) {
				req.user = user;
				next();
			}, function() {
				//WRONG
				res.status(401).send();
			});
		}
	};
}