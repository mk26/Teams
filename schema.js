UserRegSchema = new SimpleSchema({
    name: {
        type: String,
        label: "Name"
    },
    email: {
        type: String,
        regEx: SimpleSchema.RegEx.Email,
        label: "Email address"
    },
    password: {
        type: String,
        label: "Password",
        min: 5
    }
});

UserLoginSchema = new SimpleSchema({
    email: {
        type: String,
        regEx: SimpleSchema.RegEx.Email,
        label: "Email address"
    },
    password: {
        type: String,
        label: "Password",
    }
});

//Tasks = new Mongo.Collection("tasks");
TaskSchema = new SimpleSchema({
    name: {
        type: String,
        label: "Name",
        min: 1
    },
    due: {
        type: String,
        label: "Due Date",
        optional: true,
    },
    tags: {
        type: [String],
        label: "Tags",
        optional: true,
    },
    assignedto: {
        type:  String,
        regEx: SimpleSchema.RegEx.Email,
        label: "Assigned to",
        optional: true,
    },
    status: {
        type: Boolean,
        label: "Status",
        optional: true      
    },
    _id: {
        type: String,
        label: "ID"
    },
    teamID: {
        type: String,
        regEx: SimpleSchema.RegEx.Id,
        label: "Team ID",
        optional:true
    }
});
//Tasks.attachSchema(TaskSchema);
TaskSchema.messages ({
    "required name": "Task must have a name",
    "regEx assignedto": "Must be a valid email-ID",
});

Teams = new Mongo.Collection("teams");
TeamSchema = new SimpleSchema({
    name: {
        type: String,
        label: "Name",
        min: 1
    },
    members: {
        type: [String],
        label: "Team Members",
        optional: true
        //min: 1
    },
    admin: {
        type: String,
        regEx: SimpleSchema.RegEx.Id,
        label: "Team Admin",
    },
    tasks:{
        type: [TaskSchema],
        label: "Tasks",
        optional: true
    },
    channels:{
        type: [String],
        regEx: SimpleSchema.RegEx.Id,
        label: "Channel IDs",
        optional: true
    },
    conversations:{
        type: [String],
        regEx: SimpleSchema.RegEx.Id,
        label: "Conversation IDs",
        optional: true
    }
}); 
TeamSchema.messages ({
    "required admin": "Team must have an admin",
    //"required members": "Team must have a minimum of 1 member"
});
Teams.attachSchema(TeamSchema);


MessageSchema = new SimpleSchema({
	message: {
		type: String,
		label: "Message"
	},
	from:{
		type: String,
		label: "Sender"
	},
	to:{
		type: [String],
		label: "Recipient"
	},
	timestamp:{
    	type: String,
    	label: "timestamp"
	}
});