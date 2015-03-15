/* Teams app - (C) 2015, Karthik - Client side methods */

/* Common functions */

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
    if (_.contains(this.members, Meteor.user().username))
        return true;
    else
        return false;
});

//Map Username to Name
UI.registerHelper("showName", function(username) {
    var user = Meteor.users.findOne({"username": username});
    if (user)
        return user.profile.name;
});

//Detect links in messages
UI.registerHelper("autoLink", function(text) {
	return Autolinker.link(text);
});

//Check if no pending tasks
UI.registerHelper('isNone', function (obj) {
	if(obj==0) return true;
	else return false;
});

/* Common UI related functions */
//Init tooltips
function initTooltips() {
	setTimeout(function() {
		$('[data-toggle="tooltip"]').tooltip();
		$('.taskassignedto').tooltip();
	}, 200);
}

//Init tags and date fields
function initSplFields() {
	//Init tags field
	$('#tasktags').on('tokenfield:createtoken', function(e) {
			var existingTokens = $('#tasktags').tokenfield('getTokensList').split(", ");
			if(_.contains(existingTokens, e.attrs.value))
				return false;
		}).tokenfield({
			createTokensOnBlur: true
	});
	$('.tasktags').tokenfield({
		createTokensOnBlur: true
	});
	//Init date field
	$('.taskduedate').datetimepicker({
		minDate : moment()
	});
}

//Select channel/conversation from the list
function selectItem(item_id) {
	$('.channelitem').removeClass("active");
	$('.convitem').removeClass("active");
	setTimeout(function () {
		$('#'+item_id).addClass("active");
		$('.inputMsg').focus();
	}, 200);
}

//Animate
function animate(elt,style) {
	$(elt).removeClass("animated "+style);
	setTimeout(function() {
		$(elt).addClass("animated "+style);
	}, 1);
}

//Notify using HTML5 notifications
function notify(title,content) {
	var iconUrl = "/favicon_32.png";
	if (!("Notification" in window)) {
		alert("Sorry, this browser does not support notifications");
	} 
	else if (Notification.permission === "granted") {
		//If permission already available
		var notification = new Notification(title,{body:content, icon: iconUrl});
	} 
	else if (Notification.permission !== 'denied') {
		//Get permission from User
		Notification.requestPermission(function(permission) {
			// If the user is okay, let's create a notification
			if (permission === "granted") {
				var notification = new Notification(title,{body:content, icon: iconUrl});
			}
		});
	}
}

//Common layout template
Template.common.events({
	'click #back': function() {
		history.go(-1);
	},
	'click #logoutb': function() {
		if (Meteor.user()) {
			Meteor.logout();
			Router.go('/');
		}
	}
});

Template.common.rendered = function() {
	initTooltips();
};

//Manage Account page
Template.account.events({
	'click #changepassb': function(e, t) {
    	$('#changePassPanel').slideToggle();
    }
});

//Signup page
Template.signup.helpers({
    name: function() {
	    //Welcome the user with the name entered in the signup form
        return Session.get('name') ? ", " + Session.get('name') : "";
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
	            //Signup a new user
                if (error) {
	                animate('#signupPanel','wobble');
                    var message = "There was an error signing up: <strong>" + error.reason + "</strong>";
                    this.template.$('#error').show().html(message);
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
	        //Login an existing user
            var self = this;
            Meteor.loginWithPassword(doc.email.toLowerCase(), doc.password, function(error) {
                if (Meteor.user()) {
                    Router.next();
                    self.done();
                } 
                else {
	                animate('#loginPanel','wobble');
                    self.done(error);
                }
            });
            return false;
        },
        onError: function(operation, error, template) {
            if (operation == "submit") {
                var message = "There was an error logging in: <strong>" + error.reason + "</strong>";
                this.template.$('#error').show().html(message);
            }
        }
    },
    changePasswordForm: {
    	onSubmit: function(doc) {
	    	//Change password
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
	            //Set the current user as admin and remove admin if it is listed again in members
                doc.admin = Meteor.user().username;
                doc.members = _.without(doc.members,Meteor.user().username);
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
	            //Set a task ID for the task, de-duplicate tags
	            //and mark it's status as false (i.e., pending task)
                doc._id = new Mongo.ObjectID().toHexString();
                doc.teamID = Session.get('currentTeam');
                doc.tags = _.unique(doc.tags);
                doc.status = false;
                return doc;
            }
        },
        after: {
            "createTask": function(error, result, template) {
                this.template.$('#tasktags').tokenfield('setTokens', []);
                if(!error)
                	$('#newTaskPanel').slideUp();
            }
        }
    },
    updateMembersForm: {
        formToDoc: function(doc) {
            var currentMembers = Teams.findOne({"_id": Session.get('currentTeam')}).members;
            Session.set('currentMembers', currentMembers);
            Session.set('revisedMembers', doc.members);
            return doc;
        },
        onError: function(operation, error, template) {
            this.resetForm();
        },
        before: {
            update: function(docId, modifier, template) {
	            //Ensure the the members are unique and also not the admin
	            if(modifier.$set) {
	                var members = modifier.$set.members;
	                var admin = Teams.findOne({"_id":this.docId}).admin;
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
		            //Update membership status in users' profile
                	Meteor.call('updateInfoForMembers', Session.get('currentMembers'), Session.get('revisedMembers'), Session.get('currentTeam'));
                	this.resetForm();
            	}
                this.template.$('#members').tokenfield({
	                createTokensOnBlur: true
                });
            }
        }
    },
    createChannelForm: {
        after: {
            insert: function(error, result, template) {
	            //Add channel to current team and select it
                Teams.update({"_id": Session.get('currentTeam')}, {$addToSet: {"channels": result}});
                Session.set('currentChannel',result);
                selectItem(result);
            }
        }
    },
    createChannelMessageForm: {
        before: {
            insert: function(doc, template) {
	            //Set sender and timestamp
                doc.from = Meteor.user().username;
                doc.timestamp = moment().toISOString();
                return doc;
            }
        },
        after: {
            insert: function(error, result, template) {
	            //Add message ID to channel
                Channels.update({"_id":Session.get('currentChannel')},{$addToSet: {"messages" : result}});
                
            }
        }
    },
    createConvForm: {
	    before: {
	    	insert: function(doc, template) {
		    	//Set initiator of conversation ; If conversation exists already, then select it instead of 				//creating a new one.
		    	doc.owner = Meteor.user().username;
		    	var teamConv = Teams.findOne({"_id":Session.get('currentTeam')}).conversations;
		    	var isPresent = Conversations.findOne({"_id": {$in: teamConv}, $and : [{"members": doc.members}, {"owner":Meteor.user().username}]});
		    	if(isPresent) {
			    	Session.set('currentConv',isPresent._id);
			    	selectItem(isPresent._id);
			    	return false;
				}
			    else return doc;
	    	}
	    },
    	after: {
    		insert: function(error, result, template) {
	    		//Add conversation to current team and select it
    			Teams.update({"_id": Session.get('currentTeam')}, {$addToSet: {"conversations": result}});
    			Session.set('currentConv',result);
				selectItem(result);
    		}
    	}
    },
    createConvMessageForm: {
    	before: {
    		insert: function(doc, template) {
	    		//Set sender and timestamp
    			doc.from = Meteor.user().username;
    			doc.timestamp = moment().toISOString();
    			return doc;
    		}
    	},
    	after: {
    		insert: function(error, result, template) {
	    		//Add message ID to conversation
    			Conversations.update({"_id":Session.get('currentConv')},{$addToSet: {"messages" : result}});
    		}
    	}
    }
});

AutoForm.addHooks(null, {
	before: {
		"updateTask": function(doc, template) {
			//De-duplicate tags
			Session.set('currentEdit',doc._id);
			doc.tags=_.unique(doc.tags);
			return doc;
		}		
	},
    after: {
        "updateTask": function(error, result, template) {
	        //Close the edit panel
	        var panel = Session.get('currentEdit');
	        $('.editTask').removeClass("active");
	        $('#' + panel).slideUp();
            initSplFields();
        }
    }
});


//All Teams page
Template.teams.helpers({
	pendingTasks : function() {
		var result = "";
		if (Session.get('userPendingTasks') == 0)
		 	result = 0;
		else if (Session.get('userPendingTasks') == 1)
			result = "1 task pending";
		else result = Session.get('userPendingTasks') + " tasks pending";
		return result;
	},
    memteams: function() {
	    //Find members of the team
        return Teams.find({'members': Meteor.user().username});
    },
    adminteams: function() {
	    //Find the admin of the team
        return Teams.find({'admin': Meteor.user().username});
    },
    tasks: function() {
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
        //Show all tasks or pending tasks only
        tasks.forEach(function(team, i) {
            team.tasks.forEach(function(task, i) {
                if (task.assignedto == Meteor.user().username) {
                    task.teamID = team._id;
                    task.teamName = team.name;
                    result.push(task);
                }
            });
        });
        //Calculate pending tasks
        var count = _.where(result, {status:false}).length;
        Session.set('userPendingTasks',count);
        result = Session.get('archived') ? result : _.where(result, {status:false});
        initTooltips();
        //React to Search queries
        var keyword = Session.get('taskSearchKeyword');
        if(keyword) {
	        var field = $('.searchType')[0].selectize.getValue();
	        result = _.filter(result, function(task){ 
		        if(field=="tags") {
			        if(task.tags)
			        	return task.tags.join().match(new RegExp(keyword,"i"));
			    }
				else return task[field].match(new RegExp(keyword,"i"))
		    });
		}
		//React to sort specifier
        var sort_order = Session.get('sortOrder') || "due";
        return _.sortBy(result, function(e) {
            return e[sort_order];
        });
    }
});

Template.teams.events({
    'click #createb': function(e, t) {
        $('#createTeamPanel').slideToggle();
    },
    'click #showArchived': function(e, t) {
    	if(Session.get('archived')==true) {	
    		$("#showArchived").html("<span class=\"glyphicon glyphicon-ok-sign\"></span>&nbsp;Show Completed Tasks");
    		Session.set('archived',false);
    	}
    	else {
    		Session.set('archived',true);
    		$("#showArchived").html("<span class=\"glyphicon glyphicon-minus-sign\"></span>&nbsp;Hide Completed Tasks");
    	}
    },
    'click .markTask': function(e) {
        var taskItem = $(e.target.parentNode.parentNode);
        if(e.target.checked)
        	taskItem.removeClass("fadeInUp").addClass("flipOutX");
        else 
        	taskItem.removeClass("fadeInUp").addClass("bounceIn");
        var temp=this;
        taskItem.one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function() {
        	taskItem.removeClass("flipOutX bounceIn").addClass("fadeInUp");
        	Meteor.call('markTask', temp, e.target.checked);
        });
    },
    'click .addNoteToTask': function(e) {
    	$('#notePanel-' + this._id).slideToggle();
    },
    'change #sortByName': function(e) {
        Session.set('sortOrder', 'name');
    },
    'change #sortByDue': function(e) {
        Session.set('sortOrder', 'due');
    },
    'change #sortByStatus': function(e) {
        Session.set('sortOrder', 'status');
    },
    'keyup .taskSearch': function(e) {
	    Session.set('taskSearchKeyword',e.target.value);
    },
    'blur .tasknotes': function(e) {
	    //Save task note
    	var task_id = e.target.id.split("-")[1];
    	Meteor.call('updateTaskNotes', task_id, e.target.value, function(error, result) {});
    }
});

Template.teams.rendered = function() {
	$('#members').on('tokenfield:createtoken', function(e) {
			var existingTokens = $('#members').tokenfield('getTokensList').split(", ");
			if(_.contains(existingTokens, e.attrs.value) || e.attrs.value==Meteor.user().username) 
				return false;
		}).tokenfield({
			createTokensOnBlur: true,
			inputType: 'email'
	});
    $('.searchType').selectize({
	    sortField: 'text'
	});
}

//Specific Team page
Template.team.helpers({
    tasks: function() {
        var tasks = Teams.findOne({"_id": this._id},{fields: {tasks: 1}}).tasks;
        //Show all tasks or pending tasks only
        var count = _.where(tasks, {status:false}).length;
        Session.set('teamPendingTasks',count);
        var yourCount = _.where(tasks, {status:false, assignedto:Meteor.user().username}).length;
        Session.set('yourPendingTasks',yourCount);
        tasks = Session.get('archived') ? tasks : _.where(tasks, {status:false});
        initTooltips();
        //React to search query
        var keyword = Session.get('taskSearchKeyword');
        if(keyword) {
        	var field = $('.searchType')[0].selectize.getValue();
        	tasks = _.filter(tasks, function(task){ 
        		if(field=="tags") {
	        		if(task.tags)
	        			return task.tags.join().match(new RegExp(keyword,"i"));
        		}
        		else {
	        		if(task[field])
        				return task[field].match(new RegExp(keyword,"i"));
        		}
        	});
        }
        //React to sort specifier
        var sort_order = Session.get('sortOrder') || "due";
        return _.sortBy(tasks, function(e) {
            return e[sort_order];
        });
    },
    ownsTask: function() {
        if (this.assignedto == Meteor.user().username)
            return true;
        else return false;
    },
    teamMembers: function() {
	    var query = Teams.findOne({"_id":Session.get('currentTeam')});
        var team = {};
        var members = _.union(query.members,query.admin);
        members.forEach(function(member, i) {
            var name = Meteor.users.findOne({"username": member}).profile.name;
            team[member] = name + " <" + member + ">";
        });
        return team;
    },
    channels: function() {
	    initTooltips();
        return Channels.find({"_id": {$in: this.channels}},{sort: {name:1}}).fetch();
    },
    channel: function() {
        return Channels.findOne({"_id": Session.get('currentChannel')});
    },
    channelMessages: function() {
	    //Paginate the loading of messages (default limit = 10)
	    var msgLimit = Session.get('msgLimit') || 10;
	    var query = Messages.find({"_id": {$in : this.messages}},{sort: {timestamp: -1}, limit:msgLimit});
	    setTimeout(function () {
		    if(Session.get('loadMode')) {
		    	$("#channelMsgView").animate({scrollTop: 0}, 700);
		    	Session.set('loadMode',false);
			}
		   	else $("#channelMsgView").animate({scrollTop: $("#channelMsgView")[0].scrollHeight}, 700);
		}, 200);
		notify(Channels.findOne({"_id": Session.get('currentChannel')}).name,"Message received");
        return query.fetch().reverse();
    },
    isSender: function() {
	    if (this.from == Meteor.user().username)
	    	return true;
	    else return false;
    },
    formatTimeRelative: function() {
	    //Return relative date if less than 1 day, else return absolute time
	    if ((moment().diff(moment(this.timestamp), 'days')) < 1)
			return moment(this.timestamp).fromNow();
		else return moment(this.timestamp).format("MMM Do YYYY, h:mm a");
    },
    formatTimeAbsolute: function() {
	    //Return time in this specific format
    	return moment(this.timestamp).format("MMM Do YYYY, h:mm a");
    },
    conversations: function() {
	    initTooltips();
	    return Conversations.find({"_id": {$in: this.conversations}, $or : [ {"members": Meteor.user().username}, {"owner":Meteor.user().username}]}).fetch();
    },
    conversation: function() {
    	return Conversations.findOne({"_id": Session.get('currentConv')});
    },
    convMessages: function() {
	    //Paginate the loading of messages (default limit = 10)
	    var msgLimit = Session.get('msgLimit') || 10;
    	var query = Messages.find({"_id": {$in : this.messages}},{sort: {timestamp: -1}, limit:msgLimit});
    	setTimeout(function () {
    		if(Session.get('loadMode')) {
    			$("#convMsgView").animate({scrollTop: 0}, 700);
    			Session.set('loadMode',false);
    		}
    	   	else $("#convMsgView").animate({scrollTop: $("#convMsgView")[0].scrollHeight}, 700);
    	}, 200);
    	notify("Teams Private Conversation","Message received");
    	return query.fetch().reverse();
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
   	},
   	pendingTasks : function() {
	   	//Common pending tasks
   		var result = "";
   		if (Session.get('teamPendingTasks') == 0)
   		 	result = 0;
   		else if (Session.get('teamPendingTasks') == 1)
   			result = "1 task pending total";
   		else result = Session.get('teamPendingTasks') + " tasks pending total";
   		return result;
   	},
   	yourPendingTasks : function() {
	   	//User's pending tasks
   		var result = "";
   		if (Session.get('yourPendingTasks') == 0)
   		 	result = 0;
   		else result = Session.get('yourPendingTasks') + " yours";
   		return result;
   	}
});

Template.team.events({
    'click #infob': function(e, t) {
        Router.go('/t/' + this._id + '/info/');
    },
    'click #filesb': function(e, t) {
    	Router.go('/t/' + this._id + '/files/');
    },
    'click #createtaskb': function(e, t) {
        $('#newTaskPanel').slideToggle();
    },
    'click #showArchived': function(e, t) {
    	if(Session.get('archived')==true) {	
	    	$("#showArchived").html("<span class=\"glyphicon glyphicon-ok-sign\"></span>&nbsp;Show Completed Tasks");
    		Session.set('archived',false);
    	}
    	else {
	    	Session.set('archived',true);
	    	$("#showArchived").html("<span class=\"glyphicon glyphicon-minus-sign\"></span>&nbsp;Hide Completed Tasks");
	    }
    },
    'click .markTask': function(e) {
	    var taskItem = $(e.target.parentNode.parentNode);
	    if(e.target.checked) taskItem.removeClass("fadeInUp").addClass("flipOutX");
	    else taskItem.removeClass("fadeInUp").addClass("bounceIn");
	    var temp=this;
	    taskItem.one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function() {
		   	taskItem.removeClass("flipOutX bounceIn").addClass("fadeInUp");
        	Meteor.call('markTask', temp, e.target.checked);
    	});
    },
    'click .delTask': function(e) {
	    var temp=this;
	    $(e.target.parentNode).addClass("slideOutRight");
	    $(e.target.parentNode.parentElement).one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function() {
       		Meteor.call('delTask', temp);
    	});
    },
    'click .editTask': function(e) {
        initSplFields();
        $('#' + this._id).slideToggle();
    },
    'click .addNoteToTask': function(e) {
    	$('#notePanel-' + this._id).slideToggle();
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
	    Session.set('msgLimit', null); 
        Session.set('currentChannel', this._id);
        $('.channelitem').removeClass("active");
        $('.convitem').removeClass("active");
        setTimeout(function() {
	        $('.inputMsg').focus();
        }, 100);
        $(e.target).addClass("active");
    },
    'click .convitem': function(e) {
	    Session.set('currentChannel', null);
	    Session.set('msgLimit', null); 
    	Session.set('currentConv', this._id);
    	$('.channelitem').removeClass("active");
    	$('.convitem').removeClass("active");
    	setTimeout(function() {
    		$('.inputMsg').focus();
    	}, 100);
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
   	},
   	'click .loadMoreMsgs' : function(e) {
	   	Session.set('loadMode',true);
	   	Session.set('msgLimit',(Session.get('msgLimit') || 10) + 10);
   	},
   	'keyup .taskSearch': function(e) {
   		Session.set('taskSearchKeyword',e.target.value);
   	},
   	'blur .tasknotes': function(e) {
	   	var task_id = e.target.id.split("-")[1];
	   	Meteor.call('updateTaskNotes', task_id, e.target.value, function(error, result) {});
   	}
});

Template.team.rendered = function() {
	initSplFields();
	initTooltips();
	$('.searchType').selectize({
		sortField: 'text'
	});
};

//Team info page
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
    $('#members').tokenfield({
	    createTokensOnBlur: true
    });
};

//Team files page
Template.teamfiles.helpers({
	teamFiles : function(){
		return Files.find({"_id": {$in : this.files}}).fetch();
	},
	formatSize: function(bytes){
		if (bytes>=1000000000) bytes = (bytes/1000000000).toFixed(2) + ' GB';
		else if (bytes>=1000000) bytes = (bytes/1000000).toFixed(2) + ' MB';
		else if (bytes>=1000) bytes = (bytes/1000).toFixed(2) + ' KB';
		else if (bytes>1) bytes = bytes + ' bytes';
		else if (bytes==1) bytes = bytes + ' byte';
		else bytes = 'Zero bytes';
		return bytes;
	},
	formatTimeRelative: function(time) {
			//Return relative date if less than 1 day, else return absolute time
			if ((moment().diff(moment(time), 'days')) < 1)
				return moment(time).fromNow();
			else return moment(time).format("MMM Do YYYY, h:mm a");
	}
});

Template.teamfiles.events({
	'change #uploadFileBar': function(e,t) {
		//Upload each file that is chosen / dropped onto the file chooser box 
		FS.Utility.eachFile(e, function(file) {
			Files.insert(file, function (error, fileObj) {
				if (error) 
					alert("Error in file upload: " + error);
				if (fileObj)
					Teams.update({"_id": Session.get('currentTeam')}, {$addToSet: {"files": fileObj._id}});
		});
	});
		//Notify user about file upload and clear the file chooser
		notify("Teams","File uploaded");
		$("#uploadFileBar").replaceWith($("#uploadFileBar").clone());
	},
	'click .delFileb': function(e,t) {
		var file_id=e.target.id;
		$(e.target.parentNode.parentNode).addClass("zoomOut");
		$(e.target.parentNode.parentNode).one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function() {
			Files.remove({"_id":file_id});
			Teams.update({"_id":Session.get('currentTeam')}, {$pull: {"files": file_id}});
		});
	}
});