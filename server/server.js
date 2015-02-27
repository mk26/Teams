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
		var mem_ids=[];
		if(doc.members) {
			doc.members.forEach(function(member) {
				var mem = Meteor.users.findOne({"username":member},{"_id":1});
				if(mem) mem_ids.push(mem._id);
			});
		}
		var id = Teams.insert({
			name: doc.name,
			members: mem_ids,
			admin: doc.admin,
			channels: [],
			conversations: [],
			tasks: []
		});
		if(id) {
			Meteor.users.update({'_id':doc.admin},{$push: {'profile.adminOf' : id}});
			if(doc.members) {
				doc.members.forEach(function(member) {
					var mem = Meteor.users.findOne({"username":member},{"_id":1});
					if(mem) Meteor.users.update({'_id':mem._id},{$push: {'profile.memberOf' : id}});
				});
			}
		}
		return id;
	},
	deleteTeam: function(t_id) {
		var team = Teams.findOne({"_id":t_id});
		Meteor.users.update({'_id':team.admin},{$pull: {'profile.adminOf' : t_id}});
		team.members.forEach(function(member) {
				Meteor.users.update({'_id':member},{$pull: {'profile.memberOf' : t_id}});
		});
		Teams.remove({"_id":t_id});
	}
});