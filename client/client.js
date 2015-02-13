Template.signup.events({
	'keyup #name' : function(e,t) {
		Session.set('name',t.find('#name').value);
	}
});

Template.signup.helpers({
	name : function() {
		return Session.get('name') ? ", "+Session.get('name') : "";
	},
	userSchema: function() {
		return UserSchema;
	}
});

Template.login.helpers({
	userSchema: function() {
		return UserSchema;
	}
});

AutoForm.hooks({
	signupForm: {
		after: {
			"signup": function(error, result, template) {
				if(error) 
					alert(error.error);
				if(result)
					alert(result);
			}
		}
	},
	loginForm: {
		onSubmit: function(doc) {
			var self=this;
			Meteor.loginWithPassword(doc.email, doc.password, function (error) {
				if(Meteor.user()) {
					self.done();
				}
				else {
					self.done(error);
				}
			});
			return false;
		},
		onError: function(operation, error, template) {
			if(operation=="submit")
			{
				var message = "There was an error logging in: <strong>" + error.reason + "</strong>";
				template.$('#error').show().html(message);
			}
		}
	}
});
