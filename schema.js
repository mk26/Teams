//User Registration
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
        min: 3
    }
});

//User Login
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

//Change password
PasswordChangeSchema = new SimpleSchema({
    oldpassword: {
        type: String,
        label: "Old Password",
    },
    newpassword: {
        type: String,
        label: "New Password",
        min: 3
    }
});

//Tasks
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
TaskSchema.messages ({
    "required name": "Task must have a name",
    "regEx assignedto": "Must be a valid email-ID",
});

//Messages
Messages = new Mongo.Collection("messages");
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
        label: "Recipient",
        optional:true
    },
    timestamp:{
        type: String,
        label: "timestamp"
    }
});
MessageSchema.messages ({
    "required": " ",
});
Messages.attachSchema(MessageSchema);

//Channels
Channels = new Mongo.Collection("channels");
ChannelSchema = new SimpleSchema({
    name: {
        type: String,
        label: "Name",
        min: 1
    },
    messages : {
        type: [String],
        regEx: SimpleSchema.RegEx.Id,
        optional: true
    }
});
Channels.attachSchema(ChannelSchema);

//Conversations
Conversations = new Mongo.Collection("conversations");
ConversationSchema = new SimpleSchema({
    members: {
        type: [String],
        regEx: SimpleSchema.RegEx.Email,
        label: "Conversation members"
    },
    owner : {
        type: String,
        regEx: SimpleSchema.RegEx.Email,
        label: "Conversation owner"
    },
    messages : {
        type: [String],
        regEx: SimpleSchema.RegEx.Id,
        optional: true
    }
});
Conversations.attachSchema(ConversationSchema);
ConversationSchema.messages ({
    "required members": "Please select atleast one person to chat with",
});

//Teams
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
        label: "Team Members",
        optional: true,
    },
    admin: {
        type: String,
        regEx: SimpleSchema.RegEx.Email,
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
