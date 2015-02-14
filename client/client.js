/* Main Template */

Template.registerHelper('uname',function() {
	return Meteor.user().profile.name;
});

Template.commonlayout.events({
	'click #logout' : function(e,t) {
		if(Meteor.user()) {
			Meteor.logout();
			Router.go('/');
		}
	}
});
/* User Management */

Template.signup.events({
	'keyup #name' : function(e,t) {
		Session.set('name',t.find('#name').value);
	},	
	'click #login' : function(e,t) {
		Router.go('/login');
	}	
});

Template.signup.helpers({
	name : function() {
		return Session.get('name') ? ", "+Session.get('name') : "";
	},
	userSchema: function() {
		return UserRegSchema;
	}
});

Template.login.events({
	'click #signup' : function(e,t) {
		Router.go('/signup');
	}
});

Template.login.helpers({
	userSchema: function() {
		return UserLoginSchema;
	}
});

AutoForm.hooks({
	signupForm: {
		after: {
			"signup": function(error, result, template) {
				if(error) {
					var message = "There was an error signing up: <strong>" + error.reason + "</strong>";
					template.$('#error').show().html(message);
				}
				else {
					alert("Account created successfully");
					Router.go('/login');
				}
			}
		}
	},
	loginForm: {
		onSubmit: function(doc) {
			var self=this;
			Meteor.loginWithPassword(doc.email, doc.password, function (error) {
				if(Meteor.user()) {
					Router.go('/teams')
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

/* Teams main page */

Template.teams.helpers({
	teams: function() {
		return Teams.find();
	}	
});
