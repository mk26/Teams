//Server side methods
Meteor.startup(function () {
	
});

Meteor.methods({
	signup: function(doc) {
		check(doc, UserRegSchema);
		Accounts.createUser({
			username: doc.email,
			email: doc.email,
			password: doc.password,
			profile: {
				name: doc.name,
				adminOf: [],
				memberOf: []
			}
		});
	},
	createTeam: function(doc) {
		check(doc, TeamSchema);
		var mem_usernames=[];
		if(doc.members) {
			doc.members.forEach(function(member) {
				var mem = Meteor.users.findOne({"username":member});
				if(mem) mem_usernames.push(mem.username);
			});
		}
		var id = Teams.insert({
			name: doc.name,
			members: mem_usernames,
			admin: doc.admin,
			channels: [],
			conversations: [],
			tasks: []
		});
		if(id) {
			Meteor.users.update({"username":doc.admin},{$push: {"profile.adminOf" : id}});
			if(doc.members) {
				doc.members.forEach(function(member) {
					var mem = Meteor.users.findOne({"username":member});
					if(mem) Meteor.users.update({"username":mem.username},{$push: {"profile.memberOf" : id}});
				});
			}
		}
		return id;
	},
	updateInfoForMembers : function(current,revised,t_id) {
		var change = _.union(current,revised);
		var teamMembers = Teams.findOne({"_id":t_id}).members;
		if(change) {
			change.forEach(function(member) {
				var mem = Meteor.users.findOne({"username":member});
				if(mem) { 
					if(_.contains(teamMembers,mem.username)) {
						//console.log("Contains",mem.username);
						Meteor.users.update({"username":mem.username},{$addToSet: {"profile.memberOf" : t_id}});
					}
					else {
						//console.log("Does not contain",mem.username);
						Meteor.users.update({"username":mem.username},{$pull: {"profile.memberOf" : t_id}});
					}
				}
			});
		}
	},
	deleteTeam: function(t_id) {
		var team = Teams.findOne({"_id":t_id});
		Meteor.users.update({"username":team.admin},{$pull: {"profile.adminOf" : t_id}});
		team.members.forEach(function(member) {
				Meteor.users.update({"username":member},{$pull: {"profile.memberOf" : t_id}});
		});
		Teams.remove({"_id":t_id});
	},
	createTask: function(doc) {
		check(doc,TaskSchema);
		Teams.update({"_id":doc.teamID},{$push : {
			tasks: {
					_id: doc._id,
					name: doc.name,
					assignedto: doc.assignedto,
					due: doc.due,
					status: doc.status,
					tags: doc.tags
				}
			}
		});
	},
	markTask : function(task,checkValue) {
		Teams.update({"tasks._id" : task._id},{$set: {"tasks.$.status":checkValue}});
	},
	delTask : function(task) {
		Teams.update({},{$pull: {tasks : {"_id" : task._id}}},{multi:true});
	},
	updateTask : function(doc) {
		check(doc,TaskSchema);
		Teams.update({"tasks._id" : doc._id},{$set : {
					"tasks.$.name": doc.name,
					"tasks.$.assignedto": doc.assignedto,
					"tasks.$.due": doc.due,
					"tasks.$.tags": doc.tags
			}
		});
	},
	delConv : function(conv_id,t_id) {
		var messages = Conversations.findOne({"_id":conv_id}).messages;
		Teams.update({"_id":t_id},{$pull: {conversations : conv_id}});
		Messages.remove({"_id": {$in : messages}});
		Conversations.remove({"_id":conv_id});
	},
	delChannel : function(channel_id,t_id) {
		var messages = Channels.findOne({"_id":channel_id}).messages;
		Teams.update({"_id":t_id},{$pull: {channels : channel_id}});
		Messages.remove({"_id": {$in : messages}});
		Channels.remove({"_id":channel_id});
	}
});