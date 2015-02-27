Router.configure({
  layoutTemplate: 'commonlayout',
  notFoundTemplate: 'notfound'
});

Router.onBeforeAction(function () {
  if (!Meteor.user()) {
    this.render('login');
  } 
  else {
    this.next();
  }
},{
    except:['signup','login']
});

Router.route('/', function () {
    this.render('teams');
});

Router.route('/signup', function () {
    if(!Meteor.user()) {
        this.render('signup');
    }
    else this.redirect('/teams');
});

Router.route('/login', function () {
    if(!Meteor.user()) {
        this.render('login');
    }
    else this.redirect('/teams');
});

Router.route('/teams', function () {
   this.render('teams');
});

Router.route('/t/:_id', function () {
   var teamID = this.params._id;
   Session.set('currentTeam',teamID);
   var team = Teams.findOne({"_id":this.params._id})
   if($.inArray(Meteor.userId(),team.members)!=-1 || Meteor.userId() == team.admin) {
       this.render('team',{
         data:function(){
           return team;
         }
       });
    } 
    else {
        this.render('accessdenied');
    }
});

Router.route('/t/:_id/info', function () {
   var teamID = this.params._id;
   var team = Teams.findOne({"_id":this.params._id})
   if($.inArray(Meteor.userId(),team.members)!=-1 || Meteor.userId() == team.admin) {
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
   //this.render('teams');
   this.render('createteam');
});

Router.route('/account', function () {
   this.render('account');
});