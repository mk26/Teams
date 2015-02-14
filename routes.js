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