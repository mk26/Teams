Meteor.methods({
signup: function(doc) {
	check(doc, UserSchema);
	Accounts.createUser({
		username: doc.email,
		email: doc.email,
		password: doc.password,
		profile: {
			name: doc.name
		}
	});
  }
});