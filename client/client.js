/* Main Template */

Template.registerHelper('uname',function() {
	return Meteor.user().profile.name;
});

Template.registerHelper('isAdmin',function() {
	if(Meteor.userId() == this.admin) 
		return true;
	else 
		return false;
});

Template.registerHelper('isMember',function() {
	if($.inArray(Meteor.userId(),this.members)==-1) 
		return false;
	else 
		return true;
});

UI.registerHelper("expand", function(obj){
	var result = [];
	for (var id in obj) {
		result.push({id:obj[id],name:Meteor.users.findOne({"_id":obj[id]}).profile.name});
	}
	return result;
});

UI.registerHelper("showName", function(obj){
	if(obj) return Meteor.users.findOne({"username":obj}).profile.name;
});


Template.commonlayout.events({
	'click #back' : function(e,t) {
		history.go(-1);
	},
	'click #logoutb' : function(e,t) {
		if(Meteor.user()) {
			Meteor.logout();
			Router.go('/');
		}
	},
	'mouseover #logoutb' : function(e,t) {
		$('#logoutb').tooltip('show');
	}
});

Template.account.events({
	'click #back' : function(e,t) {
		history.go(-1);
	}
});

Template.teams.events({
	'click #createb' : function(e,t) {
		Router.go('/teams/create');
		//t.$('#createb').prop("disabled",true);
	}
});

Template.createteam.events({
	'click #back' : function(e,t) {
		//Template.teams.$('#createb').prop("disabled",false);
		Router.go('/teams');
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

Template.createteam.helpers({
	teamSchema: function() {
		return TeamSchema;
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
	},
	createTeamForm: {
		before:{
			"createTeam": function(doc, template) {
			  doc.admin = Meteor.userId();
			  return doc;
			}
		},
		onSuccess: function(operation, result, template) {
			Router.go('/t/'+result);
		}		
	},
	createTaskForm: {
		before: {
			insert: function(doc, template) {
				doc.teamid = Session.get('currentTeam');
				return doc;
			}
		},
		after : {
			insert: function(error, result, template) {
				Teams.update({"_id":Session.get('currentTeam')},{$addToSet: {tasks:result}});
			}
		}
	}
});

/* All Teams page */

Template.teams.helpers({
	memteams: function() {
		return Teams.find({'members':Meteor.userId()});

	},
	adminteams:function() {
		return Teams.find({'admin':Meteor.userId()});
	}
});

Template.createteam.rendered = function() {
	$('#members').tokenfield({
		inputType:'email'
	});
};

/* Team page */

Template.team.helpers({
	name: function() {
		return this.name;
	},
	tasks: function() {
		t_id = Session.get('currentTeam');
		//return Tasks.find();
		//var task_ids = Teams.findOne({"_id":t_id},{"tasks":1});
		return Tasks.find({"teamid":t_id}).fetch();
	}
});

Template.team.events({
	'mouseover #infob' : function(e,t) {
		$('#infob').tooltip('show');
	},
	'click #infob' : function(e,t) {
		t_id = Session.get('currentTeam');
		Router.go('/t/'+t_id+'/info/');
	}
});

Template.team.rendered = function() {
	$('#tasktags').tokenfield();
	$('#taskduedate').datetimepicker();
	$('.taskassignedto').tooltip();
};

Template.teaminfo.helpers({
	admin: function() {
		var user = Meteor.users.findOne({"_id":this.admin});
		return user.profile.name;
	}
});

Template.teaminfo.rendered = function() {
	$('#members').tokenfield({
		inputType:'email'
	});
	var unames = [];
	/*var ids = [];
	ids.push($('#members').tokenfield('getTokensList'));
	ids.forEach(function(id) {
		var uname = Meteor.users.findOne({"_id":id},{username:1});
		unames.push(uname.username);
	});
	$('#members').tokenfield('setTokens',unames);*/
};

Template.teaminfo.events({
	'click #back' : function(e,t) {
		history.go(-1);
	},
	'click #addb' : function(e,t) {
		$('#addcontainer').toggle();
	},
	'click #deleteb' : function(e,t) {
		t_id = Session.get('currentTeam');
		Meteor.call('deleteTeam', t_id);
		Router.go('/teams');
	}
});
