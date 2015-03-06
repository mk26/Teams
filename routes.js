Router.configure({
  layoutTemplate: 'commonlayout',
  notFoundTemplate: 'notfound'
});

Router.onBeforeAction(function () {
  if (Meteor.user()) {
      this.next();
  } 
  else this.render('login');
},{
    except:['signup','login']
});

Router.route('/', function () {
    this.redirect('/teams');
});

Router.route('/signup', function () {
    if(Meteor.user()) {
        this.redirect('/teams');
    }
    else this.render('signup');
});

Router.route('/login', function () {
    if(Meteor.user()) {
        this.redirect('/teams');
    }
    else this.render('login');
});

Router.route('/teams', function () {
   this.render('teams');
});

Router.route('/t/:_id', function () {
   var teamID = this.params._id;
   Session.set('currentTeam',teamID);
   var team = Teams.findOne({"_id":this.params._id})
   if(team) {
   if($.inArray(Meteor.user().username,team.members)!=-1 || Meteor.user().username == team.admin) {
       this.render('team',{
         data:function(){
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

Router.route('/t/:_id/info', function () {
   var teamID = this.params._id;
   var team = Teams.findOne({"_id":this.params._id})
   if($.inArray(Meteor.user().username,team.members)!=-1 || Meteor.user().username == team.admin) {
       this.render('teaminfo',{
         data:function(){
           return team;
         }
       });
    } 
    else {
        this.render('accessdenied');
    }
});

Router.route('/teams/create', function () {
   this.render('createteam');
});

Router.route('/account', function () {
   this.render('account');
});