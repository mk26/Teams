/* Teams app stylesheet - (C) 2015, Karthik - Routes */

//Initialize router
Router.configure({
    //Set common templates
    layoutTemplate: 'common',
    notFoundTemplate: 'notfound'
});

//Check if user is logged in before processing every route
Router.onBeforeAction(function() {
    if (Meteor.user()) {
        this.next();
    } 
    else this.render('login');
}, {
    except: ['signup', 'login']
});

/* Routes */
Router.route('/', function() {
    this.redirect('/teams');
});

Router.route('/signup', function() {
    if (Meteor.user()) {
        this.redirect('/teams');
    }
    else this.render('signup');
});

Router.route('/login', function() {
    if (Meteor.user()) {
        this.redirect('/teams');
    } 
    else this.render('login');
});

Router.route('/account', function() {
    this.render('account');
});

Router.route('/teams', function() {
    this.render('teams');
});

Router.route('/t/:_id', function() {
    var teamID = this.params._id;
    Session.set('currentTeam', teamID);
    var team = Teams.findOne({"_id": this.params._id});
    if (team) {
        if (_.contains(team.members, Meteor.user().username) || Meteor.user().username == team.admin) {
            this.render('team', {
                data: function() {
                    return team;
                }
            });
        } 
        else {
            this.render('accessdenied');
        }
    } 
    else {
        this.render('notfound');
    }
});

Router.route('/t/:_id/info', function() {
    var teamID = this.params._id;
    Session.set('currentTeam', teamID);
    var team = Teams.findOne({"_id": this.params._id});
    if (_.contains(team.members, Meteor.user().username) || Meteor.user().username == team.admin) {
        this.render('teaminfo', {
            data: function() {
                return team;
            }
        });
    } 
    else {
        this.render('accessdenied');
    }
});

Router.route('/t/:_id/files', function() {
    var teamID = this.params._id;
    Session.set('currentTeam', teamID);
    var team = Teams.findOne({"_id": this.params._id});
    if (_.contains(team.members, Meteor.user().username) || Meteor.user().username == team.admin) {
        this.render('teamfiles', {
            data: function() {
                return team;
            }
        });
    }
    else {
        this.render('accessdenied');
    }
});