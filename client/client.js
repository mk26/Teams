/* Common functions */

//Get User's name
Template.registerHelper('uname',function() {
	return Meteor.user().profile.name;
});

//Check whether the current user is the Admin of the Team
Template.registerHelper('isAdmin',function() {
	var currentTeam = Teams.findOne({"_id":Session.get('currentTeam')});
	if(Meteor.userId() == currentTeam.admin) 
		return true;
	else 
		return false;
});

//Check whether the current user is a Member of the Team
Template.registerHelper('isMember',function() {
	if($.inArray(Meteor.userId(),this.members)==-1) 
		return false;
	else 
		return true;
});

//Map User ID to Name
UI.registerHelper("expand", function(obj){
	var result = [];
	for (var id in obj) {
		result.push({id:obj[id],name:Meteor.users.findOne({"_id":obj[id]}).profile.name});
	}
	return result;
});

//Map Username to Name
UI.registerHelper("showName", function(obj){
	if(obj) return Meteor.users.findOne({"username":obj}).profile.name;
});

//Go Back, Logout
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

/* User Management */

//Account page
Template.account.helpers({
	username: function() {
		return Meteor.user().username;
	}
});

Template.account.events({

});

//Signup page
Template.signup.helpers({
	name : function() {
		return Session.get('name') ? ", "+Session.get('name') : "";
	},
	userSchema: function() {
		return UserRegSchema;
	}
});

Template.signup.events({
	'keyup #name' : function(e,t) {
		Session.set('name',t.find('#name').value);
	},	
	'click #login' : function(e,t) {
		Router.go('/login');
	}	
});

//Login page
Template.login.helpers({
	userSchema: function() {
		return UserLoginSchema;
	}
});

Template.login.events({
	'click #signup' : function(e,t) {
		Router.go('/signup');
	}
});

/* Form-related functionality across the app */

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
			"createTask": function(doc, template) {
				doc._id = new Mongo.ObjectID().toHexString();
				doc.teamID = Session.get('currentTeam');
				return doc;
			}
		},
		after: {
			"createTask": function(doc, template) {
				this.template.$('#tasktags').tokenfield('setTokens',[]);
			}
		}
	},
	updateMembersForm: {
		docToForm: function(doc) {
		  doc.members.forEach(function(mem, i) {
			  doc.members[i] = Meteor.users.findOne({"_id":mem}).username;
		  });
		  return doc;
		},
		formToDoc: function(doc) {
		  doc.members.forEach(function(mem, i) {
			  var tmp = Meteor.users.findOne({"username":mem})._id;
			  if(tmp) doc.members[i] = tmp;
		  });
		  return doc;
		},
		onError: function(operation, error, template) {
			this.resetForm();
		},
		after : {
			update : function(error, result, template) {
				this.resetForm();
				this.template.$('#members').tokenfield();
			}
		}
	}
});

AutoForm.addHooks(null, {
	after: {
			"updateTask": function(doc, template) {
				this.template.$('.tasktagse').tokenfield({
	createTokensOnBlur:true
			});
				this.template.$('.taskduedatee').datetimepicker();
				//this.template.$('.editTaskPanel').slideToggle();
			}
		}
	}
);

/* Teams Functionality */

//All Teams page
Template.teams.helpers({
	memteams: function() {
		return Teams.find({'members':Meteor.userId()});

	},
	adminteams:function() {
		return Teams.find({'admin':Meteor.userId()});
	},
	tasks: function() {
		t_id = Session.get('currentTeam');
		var result = [];
		var tasks = Teams.find({"tasks":{$elemMatch: {"assignedto" : Meteor.user().username}}},{fields: {name:1, tasks:1}}).fetch();
		tasks.forEach(function(team, i) {
			team.tasks.forEach(function(task, i) {
				if(task.assignedto == Meteor.user().username)
				{	task.teamID = team._id;
					task.teamName = team.name;
					result.push(task);
				}
			});
		});
		var sort_order = Session.get('sortOrder') ? Session.get('sortOrder') : "name";
		return _.sortBy(result,function(e) {
			return e[sort_order];
		});
		//return result;
	}
});

Template.teams.events({
	'click #createb' : function(e,t) {
		$('#createTeamPanel').slideToggle();
		//Router.go('/teams/create');
		//t.$('#createb').prop("disabled",true);
	},
	'click .markTask' : function(e) {
		Meteor.call('markTask',this,e.target.checked);
	},
	'change #sortByName' : function(e) {
		Session.set('sortOrder','name');
	},
	'change #sortByDue' : function(e) {
		Session.set('sortOrder','due');
	},
	'change #sortByAssigned' : function(e) {
		Session.set('sortOrder','assignedto');
	},
	'change #sortByStatus' : function(e) {
		Session.set('sortOrder','status');
	}
});

Template.teams.rendered = function() {
	$('#members').tokenfield({
		inputType:'email'
	});
};

//Specific Team page
Template.team.helpers({
	name: function() {
		return this.name;
	},
	tasks: function() {
		var t_id = Session.get('currentTeam');
		var sort_order = Session.get('sortOrder') ? Session.get('sortOrder') : "name";
		//return Tasks.find();
		var tasks = Teams.findOne({"_id":t_id},{"tasks":1}).tasks;
		return _.sortBy(tasks,function(e) {
			return e[sort_order];
		});
		//return Tasks.find({"teamid":t_id}).fetch();
	},
	ownsTask:function() {
		if (this.assignedto == Meteor.user().username) 
			return true;
		else return false;
	},
	TaskSchema:function() {
		return TaskSchema;
	},
	teamMembers:function() {
		var t_id = Session.get('currentTeam');
		var members = Teams.findOne({"_id":t_id}).members;
		var team = {};
		members.forEach(function(e, i) {
			var member = Meteor.users.findOne({"_id":e});
			var memberName = member.profile.name;
			var memberEmail = member.username;
			team[memberEmail] = memberName+" <"+memberEmail+">";
		});
		return team;
	}
});

Template.team.events({
	'mouseover #infob' : function(e,t) {
		$('#infob').tooltip('show');
	},
	'click #infob' : function(e,t) {
		t_id = Session.get('currentTeam');
		Router.go('/t/'+t_id+'/info/');
	},
	'click #createtaskb' : function(e,t) {
		$('#newTask').slideToggle();
	},
	'click .markTask' : function(e) {
		Meteor.call('markTask',this,e.target.checked);
	},
	'click .delTask' : function(e) {
		Meteor.call('delTask',this);
	},
	'click .editTask' : function(e) {
		$('.tasktagse').tokenfield({
			createTokensOnBlur:true
		});
		$('.taskduedatee').datetimepicker();
		$('#'+this._id).slideToggle();
	},
	'change #sortByName' : function(e) {
		Session.set('sortOrder','name');
	},
	'change #sortByDue' : function(e) {
		Session.set('sortOrder','due');
	},
	'change #sortByAssigned' : function(e) {
		Session.set('sortOrder','assignedto');
	},
	'change #sortByStatus' : function(e) {
		Session.set('sortOrder','status');
	}
});

Template.team.rendered = function() {
	$('#tasktags').tokenfield({
		createTokensOnBlur:true
	});
	$('#taskduedate').datetimepicker();
	$('.tasktagse').tokenfield({
		createTokensOnBlur:true
	});
	$('.taskduedatee').datetimepicker();
	$('.taskassignedto').tooltip();
};

//Team info page
Template.teaminfo.helpers({
	admin: function() {
		var user = Meteor.users.findOne({"_id":this.admin});
		return user.profile.name;
	}
});

Template.teaminfo.events({
	'click #back' : function(e,t) {
		history.go(-1);
	},
	'click #addb' : function(e,t) {
		$('#addcontainer').slideToggle();
	},
	'click #deleteb' : function(e,t) {
		t_id = Session.get('currentTeam');
		Meteor.call('deleteTeam', t_id);
		Router.go('/teams');
	}
});

Template.teaminfo.rendered = function() {
	$('#members').on('tokenfield:createdtoken', function (e) {
 	var re = /\S+@\S+\.\S+/
 	var valid = re.test(e.attrs.value)
 	if (!valid) {
 	  $(e.relatedTarget).addClass('invalid')
 	}
   }).tokenfield();
	var unames = [];
	/*var ids = [];
	ids.push($('#members').tokenfield('getTokensList'));
	ids.forEach(function(id) {
		var uname = Meteor.users.findOne({"_id":id},{username:1});
		unames.push(uname.username);
	});
	$('#members').tokenfield('setTokens',unames);*/
};