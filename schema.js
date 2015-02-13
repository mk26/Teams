UserSchema = new SimpleSchema({
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
        min: 6
    }
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
        regEx: SimpleSchema.RegEx.Email,
        label: "Users",
        optional: true
    },
    admin: {
        type: String,
        regEx: SimpleSchema.RegEx.Email,
        label: "Admin",
    }
});
Teams.attachSchema(TeamSchema);

TaskSchema = new SimpleSchema({
    name: {
        type: String,
        label: "Name",
        min: 1
    },
    due: {
        type: Date,
        label: "Due Date",
        optional: true
    },
    tags: {
        type: [String],
        label: "Tags",
        optional: true
    },
    assignedto: {
        type: [UserSchema],
        label: "Assigned to",
        optional: true
    }
});

MessageSchema = new SimpleSchema({
	message: {
		type: String,
		label: "Message"
	},
	from:{
		type: UserSchema,
		label: "Sender"
	},
	to:{
		type: [UserSchema],
		label: "Recipient"
	}
});