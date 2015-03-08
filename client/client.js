/* Common functions */

//Get User's name
Template.registerHelper('currentName', function() {
    return Meteor.user().profile.name;
});

Template.registerHelper('currentUserName', function() {
    return Meteor.user().username;
});

//Check whether the current user is the Admin of the Team
Template.registerHelper('isAdmin', function() {
    var currentTeam = Teams.findOne({"_id": Session.get('currentTeam')});
    if (Meteor.user().username == currentTeam.admin)
        return true;
    else
        return false;
});

//Check whether the current user is a Member of the Team
Template.registerHelper('isMember', function() {
    if ($.inArray(Meteor.user().username, this.members) == -1)
        return false;
    else
        return true;
});

//Map Username to Name
UI.registerHelper("showName", function(username) {
    var user = Meteor.users.findOne({"username": username});
    if (user)
        return user.profile.name;
});

//Go Back, Logout
Template.commonlayout.events({
    'click #back': function() {
        history.go(-1);
    },
    'click #logoutb': function() {
        if (Meteor.user()) {
            Meteor.logout();
            Router.go('/');
        }
    },
    'mouseover #logoutb': function() {
        $('#logoutb').tooltip('show');
    }
});

//Animate
function animate(elt,style) {
	$(elt).removeClass("animated "+style);
	setTimeout(function() {
		$(elt).addClass("animated "+style);
	}, 1);
}

/* User Management */

//Account page
Template.account.helpers({

});

Template.account.events({
	'click #changepassb': function(e, t) {
    	$('#changePassPanel').slideToggle();
    }
});

//Signup page
Template.signup.helpers({
    name: function() {
        return Session.get('name') ? ", " + Session.get('name') : "";
    },
    userSchema: function() {
        return UserRegSchema;
    }
});

Template.signup.events({
    'keyup #name': function(e, t) {
        Session.set('name', t.find('#name').value);
    },
    'click #login': function(e, t) {
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
    'click #signup': function(e, t) {
        Router.go('/signup');
    }
});

/* Form-related functionality across the app */
AutoForm.hooks({
    signupForm: {
        after: {
            "signup": function(error, result, template) {
                if (error) {
                    var message = "There was an error signing up: <strong>" + error.reason + "</strong>";
                    template.$('#error').show().html(message);
                } else {
                    alert("Account created successfully");
                    Router.go('/login');
                }
            }
        }
    },
    loginForm: {
        onSubmit: function(doc) {
            var self = this;
            Meteor.loginWithPassword(doc.email, doc.password, function(error) {
                if (Meteor.user()) {
                    Router.next();
                    self.done();
                } else {
	                animate('#loginPanel','wobble');
                    self.done(error);
                }
            });
            return false;
        },
        onError: function(operation, error, template) {
            if (operation == "submit") {
                var message = "There was an error logging in: <strong>" + error.reason + "</strong>";
                template.$('#error').show().html(message);
            }
        }
    },
    changePasswordForm: {
    		onSubmit: function(doc) {
    			var self = this;
    			Accounts.changePassword(doc.oldpassword, doc.newpassword, function(error) {
    				if(error) {
	    				animate('#changePassPanel','shake');
    					self.done(error);
    				} 
    				else {
	    				$('#error').hide().html("");
	    				$('#success').show().html("Password Changed successfully");
	    				self.done();
    				}
    			});
    			return false;
    		},
    		onError: function(operation, error, template) {
    			if (operation == "submit") {
	    			$('#success').hide().html("");
    				var message = "There was an error changing the password: <strong>" + error.reason + "</strong>";
    				$('#error').show().html(message);
    			}
    		}
    },
    createTeamForm: {
        before: {
            "createTeam": function(doc, template) {
                doc.admin = Meteor.user().username;
                return doc;
            }
        },
        onSuccess: function(operation, result, template) {
            Router.go('/t/' + result);
        }
    },
    createTaskForm: {
        before: {
            "createTask": function(doc, template) {
                doc._id = new Mongo.ObjectID().toHexString();
                doc.teamID = Session.get('currentTeam');
                doc.status = false;
                return doc;
            }
        },
        after: {
            "createTask": function(error,result, template) {
                this.template.$('#tasktags').tokenfield('setTokens', []);
                if(!error)
                	$('#newTask').slideUp();
            }
        }
    },
    updateMembersForm: {
        formToDoc: function(doc) {
            var currentMembers = Teams.findOne({
                "_id": Session.get('currentTeam')
            }).members;
            Session.set('currentMembers', currentMembers);
            Session.set('revisedMembers', doc.members);
            return doc;
        },
        onError: function(operation, error, template) {
            this.resetForm();
        },
        before: {
            update: function(docId, modifier, template) {
	            if(modifier.$set) {
	                var members = modifier.$set.members;
	                var admin = Teams.findOne({"_id":docId}).admin;
	                members.forEach(function(member) {
	                    var mem = Meteor.users.findOne({"username": member});
	                    if (!mem)
	                        modifier.$set.members = _.without(members, member);
	                    if (member == admin) 
	                    	modifier.$set.members = _.without(members, member);	                    
	                });
	                modifier.$set.members = _.unique(modifier.$set.members);
	                return modifier;
            	} 
            	else return modifier;
            }
        },
        after: {
            update: function(error, result, template) {
	            if(!error) {
                	Meteor.call('updateInfoForMembers', Session.get('currentMembers'), Session.get('revisedMembers'), Session.get('currentTeam'));
                	this.resetForm();
            	}
                this.template.$('#members').tokenfield();
            }
        }
    },
    createChannelForm: {
        after: {
            insert: function(error, result, template) {
                Teams.update({"_id": Session.get('currentTeam')}, {$addToSet: {"channels": result}});
                Session.set('currentChannel',result);
                $('.channelitem').removeClass("active");
                $('.convitem').removeClass("active");
                $('.inputMsg').focus();
                $('#'+result).addClass("active");
            }
        }
    },
    createChannelMessageForm: {
        before: {
            insert: function(doc, template) {
                doc.from = Meteor.user().username;
                doc.timestamp = moment().toISOString();
                return doc;
            }
        },
        after: {
            insert: function(error, result, template) {
                Channels.update({"_id":Session.get('currentChannel')},{$addToSet: {"messages" : result}});
            }
        }
    },
    createConvForm: {
	    before: {
	    	insert: function(doc, template) {
		    	doc.owner = Meteor.user().username;
		    	var teamConv = Teams.findOne({"_id":Session.get('currentTeam')}).conversations;
		    	var isPresent = Conversations.findOne({"_id": {$in: teamConv}, $and : [{"members": doc.members}, {"owner":Meteor.user().username}]});
		    	if(isPresent) {
			    	Session.set('currentConv',isPresent._id);
			    	$('.channelitem').removeClass("active");
			    	$('.convitem').removeClass("active");
			    	$('.inputMsg').focus();
			    	$('#'+isPresent._id).addClass("active");
			    	return false;
				}
			    else return doc;
	    	}
	    },
    	after: {
    		insert: function(error, result, template) {
    			Teams.update({"_id": Session.get('currentTeam')}, {$addToSet: {"conversations": result}});
    			Session.set('currentConv',result);
    			$('.channelitem').removeClass("active");
    			$('.convitem').removeClass("active");
    			$('#'+result).addClass("active");
    			$('.inputMsg').focus();
    		}
    	}
    },
    createConvMessageForm: {
    	before: {
    		insert: function(doc, template) {
    			doc.from = Meteor.user().username;
    			doc.timestamp = moment().toISOString();
    			return doc;
    		}
    	},
    	after: {
    		insert: function(error, result, template) {
    			Conversations.update({"_id":Session.get('currentConv')},{$addToSet: {"messages" : result}});
    		}
    	}
    }
});

AutoForm.addHooks(null, {
    after: {
        "updateTask": function(error, result, template) {
            this.template.$('.tasktagse').tokenfield({
                createTokensOnBlur: true
            });
            this.template.$('.taskduedatee').datetimepicker({
	            minDate : moment()
            });
        }
    }
});

/* Teams Functionality */

//All Teams page
Template.teams.helpers({
    memteams: function() {
        return Teams.find({
            'members': Meteor.user().username
        });
    },
    adminteams: function() {
        return Teams.find({
            'admin': Meteor.user().username
        });
    },
    tasks: function() {
        t_id = Session.get('currentTeam');
        var result = [];
        var tasks = Teams.find({
            "tasks": {
                $elemMatch: {
                    "assignedto": Meteor.user().username
                }
            }
        }, {
            fields: {
                name: 1,
                tasks: 1
            }
        }).fetch();
        tasks.forEach(function(team, i) {
            team.tasks.forEach(function(task, i) {
                if (task.assignedto == Meteor.user().username) {
                    task.teamID = team._id;
                    task.teamName = team.name;
                    result.push(task);
                }
            });
        });
        var sort_order = Session.get('sortOrder') ? Session.get('sortOrder') : "name";
        return _.sortBy(result, function(e) {
            return e[sort_order];
        });
        //return result;
    }
});

Template.teams.events({
    'click #createb': function(e, t) {
        $('#createTeamPanel').slideToggle();
        //Router.go('/teams/create');
        //t.$('#createb').prop("disabled",true);
    },
    'click .markTask': function(e) {
        Meteor.call('markTask', this, e.target.checked);
    },
    'change #sortByName': function(e) {
        Session.set('sortOrder', 'name');
    },
    'change #sortByDue': function(e) {
        Session.set('sortOrder', 'due');
    },
    'change #sortByStatus': function(e) {
        Session.set('sortOrder', 'status');
    }
});

Template.teams.rendered = function() {
    $('#members').tokenfield({
        inputType: 'email'
    });
};

//Specific Team page
Template.team.helpers({
    name: function() {
        return this.name;
    },
    tasks: function() {
        var sort_order = Session.get('sortOrder') ? Session.get('sortOrder') : "status";
        var tasks = Teams.findOne({"_id": this._id}).tasks;
        tasks = Session.get('archived') ? tasks : _.where(tasks, {status:false});
        return _.sortBy(tasks, function(e) {
            return e[sort_order];
        });
        //return Tasks.find({"teamid":t_id}).fetch();
    },
    ownsTask: function() {
        if (this.assignedto == Meteor.user().username)
            return true;
        else return false;
    },
    TaskSchema: function() {
        return TaskSchema;
    },
    teamMembers: function() {
        var team = {};
        var members = _.union(this.members,this.admin);
        members.forEach(function(member, i) {
            var name = Meteor.users.findOne({"username": member}).profile.name;
            team[member] = name + " <" + member + ">";
        });
        return team;
    },
    channels: function() {
        return Channels.find({"_id": {$in: this.channels}}).fetch();
    },
    channel: function() {
        return Channels.findOne({"_id": Session.get('currentChannel')});
    },
    channelMessages: function() {
        return Messages.find({"_id": {$in : this.messages}}).fetch();
    },
    isOwner: function() {
	    if (this.from == Meteor.user().username)
	    	return true;
	    else return false;
    },
    formatTime: function() {
	   return moment(this.timestamp).fromNow();
	   //format("MMM Do YYYY, h:mm a");
    },
    conversations: function() {
	    return Conversations.find({"_id": {$in: this.conversations}, $or : [ {"members": Meteor.user().username}, {"owner":Meteor.user().username}]}).fetch();
    },
    conversation: function() {
    	return Conversations.findOne({"_id": Session.get('currentConv')});
    },
    convMessages: function() {
    	return Messages.find({"_id": {$in : this.messages}}).fetch();
    },
    convMembers: function() {
    	var team = {};
    	var members = _.without((_.union(this.members,this.admin)),Meteor.user().username);
    	members.forEach(function(e, i) {
    		var member = Meteor.users.findOne({"username": e});
    		var memberName = member.profile.name;
    		var memberEmail = member.username;
    		team[memberEmail] = memberName + " <" + memberEmail + ">";
    	});
    	return team;
    },
    excludeMe: function() {
	    return _.without(this.members,Meteor.user().username);
    },
    isCurrentUser: function() {
    		if (this == Meteor.user().username)
    			return true;
    		else return false;
   	},
   	isInitiator: function() {
   	  		if (this.owner == Meteor.user().username)
   	  			return true;
   	  		else return false;
   	}  
});

Template.team.events({
    'mouseover #infob': function(e, t) {
        $('#infob').tooltip('show');
    },
    'click #infob': function(e, t) {
        t_id = Session.get('currentTeam');
        Router.go('/t/' + t_id + '/info/');
    },
    'click #createtaskb': function(e, t) {
        $('#newTask').slideToggle();
    },
    'click #showArchived': function(e, t) {
    	if(Session.get('archived')==true)
    		Session.set('archived',false);
    	else Session.set('archived',true);
    },
    'click .markTask': function(e) {
	    if(e.target.checked)
	    	$(e.target.parentNode.parentNode).removeClass("fadeInUp").addClass("flipOutX");
	    else 
	    	$(e.target.parentNode.parentNode).removeClass("fadeInUp").addClass("bounceIn");
	    var temp=this;
	    $(e.target.parentNode.parentElement).one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function() {
		    $(e.target.parentNode.parentNode).removeClass("flipOutX bounceIn").addClass("fadeInUp");
        	Meteor.call('markTask', temp, e.target.checked);
    	});
    },
    'click .delTask': function(e) {
        Meteor.call('delTask', this);
    },
    'click .editTask': function(e) {
        $('.tasktagse').tokenfield({
            createTokensOnBlur: true
        });
        $('.taskduedatee').datetimepicker({
			minDate : moment()
		});
        $('#' + this._id).slideToggle();
    },
    'change #sortByName': function(e) {
        Session.set('sortOrder', 'name');
    },
    'change #sortByDue': function(e) {
        Session.set('sortOrder', 'due');
    },
    'change #sortByAssigned': function(e) {
        Session.set('sortOrder', 'assignedto');
    },
    'change #sortByStatus': function(e) {
        Session.set('sortOrder', 'status');
    },
    'click .channelitem': function(e) {
	    Session.set('currentConv', null);
        Session.set('currentChannel', this._id);
        $('.channelitem').removeClass("active");
        $('.convitem').removeClass("active");
        $('.inputMsg').focus();
        $(e.target).addClass("active");
    },
    'click .convitem': function(e) {
	    Session.set('currentChannel', null);
    	Session.set('currentConv', this._id);
    	$('.channelitem').removeClass("active");
    	$('.convitem').removeClass("active");
    	$('.inputMsg').focus();
    	$(e.target).addClass("active");
    },
    'click .delConv': function(e) {
	    $(e.target.parentNode).addClass("animated bounceOutLeft");
	    var temp = this;
		$(e.target.parentNode.parentElement).one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function() {
			Session.set('currentConv', null);
	    	Meteor.call('delConv', temp._id, Session.get('currentTeam'));
		});
    },
    'click .delChannel': function(e) {
	    $(e.target.parentNode).addClass("animated bounceOutLeft");
	    var temp = this;
	    $(e.target.parentNode.parentElement).one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function() {
		    Session.set('currentChannel', null);
		   	Meteor.call('delChannel', temp._id, Session.get('currentTeam'));
   		});
   	}
});

Template.team.rendered = function() {
	console.log("rendered");
    $('#tasktags').tokenfield({
        createTokensOnBlur: true
    });
    $('#taskduedate').datetimepicker({
		minDate : moment()
	});
    $('.tasktagse').tokenfield({
        createTokensOnBlur: true
    });
    $('.taskduedatee').datetimepicker({
		minDate : moment()
	});
    $('.taskassignedto').tooltip();
};

//Team info page
Template.teaminfo.helpers({

});

Template.teaminfo.events({
    'click #editb': function(e, t) {
        $('#editMembersPanel').slideToggle();
    },
    'click #delb': function(e, t) {
        Meteor.call('delTeam', this._id);
        Router.go('/teams');
    }
});

Template.teaminfo.rendered = function() {
    $('#members').on('tokenfield:createdtoken', function(e) {
        var re = /\S+@\S+\.\S+/;
        var valid = re.test(e.attrs.value);
        if (!valid) {
            $(e.relatedTarget).addClass('invalid');
        }
    }).tokenfield();
};