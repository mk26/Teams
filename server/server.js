/* Server side methods */

//Run on server startup
Meteor.startup(function () {
	
});

Meteor.methods({
	signup: function(doc) {
		//Validate again for safety, then insert
		check(doc, UserRegSchema);
		Accounts.createUser({
			username: doc.email.toLowerCase(),
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
		//Validate again for safety
		check(doc, TeamSchema);
		var mem_usernames=[];
		//Check if given users exist already
		if(doc.members) {
			doc.members.forEach(function(member) {
				var mem = Meteor.users.findOne({"username": member});
				if(mem) mem_usernames.push(mem.username);
			});
		}
		//Insert
		var id = Teams.insert({
			name: doc.name,
			members: mem_usernames,
			admin: doc.admin,
			channels: [],
			conversations: [],
			tasks: []
		});
		//Update users' profile to reflect team membership status
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
	updateInfoForMembers: function(current,revised,t_id) {
		//Identify change in users, then update their profile to reflect team membership status
		var change = _.union(current,revised);
		var teamMembers = Teams.findOne({"_id":t_id}).members;
		if(change) {
			change.forEach(function(member) {
				var mem = Meteor.users.findOne({"username":member});
				if(mem) { 
					if(_.contains(teamMembers,mem.username)) {
						Meteor.users.update({"username":mem.username},{$addToSet: {"profile.memberOf" : t_id}});
					}
					else {
						Meteor.users.update({"username":mem.username},{$pull: {"profile.memberOf" : t_id}});
					}
				}
			});
		}
	},
	delTeam: function(t_id) {
		var team = Teams.findOne({"_id":t_id});
		//Delete team admin & members, if any
		Meteor.users.update({"username":team.admin},{$pull: {"profile.adminOf" : t_id}});
		if(team.members) {
			team.members.forEach(function(member) {
				Meteor.users.update({"username":member},{$pull: {"profile.memberOf" : t_id}});
			});
		}
		//Delete channels and conversations associated with the team, including the messages contained
		if(team.channels) {
			team.channels.forEach(function(channel_id){
				Meteor.call('delChannel',channel_id,t_id);
			});
		}
		if(team.conversations) {
			team.conversations.forEach(function(conv_id){
				Meteor.call('delConv',conv_id,t_id);
			});
		}
		//Finally, Delete all tasks and the team itself
		Teams.remove({"_id":t_id});
	},
	createTask: function(doc) {
		//Validate again for safety, then insert
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
	markTask: function(task,checkValue) {
		//Set status of task to true (completed) or false (pending)
		Teams.update({"tasks._id" : task._id},{$set: {"tasks.$.status":checkValue}});
	},
	delTask: function(task) {
		//Delete specified task
		Teams.update({},{$pull: {tasks : {"_id" : task._id}}},{multi:true});
	},
	updateTask: function(doc) {
		//Validate again for safety, then update
		check(doc,TaskSchema);
		Teams.update({
			"tasks._id" : doc._id
			},
			{
				$set : {
					"tasks.$.name": doc.name,
					"tasks.$.assignedto": doc.assignedto,
					"tasks.$.due": doc.due,
					"tasks.$.tags": doc.tags
			}
		});
	},
	delConv: function(conv_id,t_id) {
		//Find messages in the conversation
		var messages = Conversations.findOne({"_id":conv_id}).messages;
		//Remove conversations from Team
		Teams.update({"_id":t_id},{$pull: {conversations : conv_id}});
		//Remove all messages from conversations
		if(messages) Messages.remove({"_id": {$in : messages}});
		//Remove the conversation itself
		Conversations.remove({"_id":conv_id});
	},
	delChannel: function(channel_id,t_id) {
		//Similar to above function, but for channels
		var messages = Channels.findOne({"_id":channel_id}).messages;
		Teams.update({"_id":t_id},{$pull: {channels : channel_id}});
		if(messages) Messages.remove({"_id": {$in : messages}});
		Channels.remove({"_id":channel_id});
	},
	getEmailNamePair: function(t_id) {
		var members = Teams.findOne({"_id":t_id},{fields:{members:1}}).members;
		var result = {};
		members.forEach(function(member, i) {
			var name = Meteor.users.findOne({"username": member}).profile.name;
			result[member] = name + " <" + member + ">";
		});
		return result;
	}
});