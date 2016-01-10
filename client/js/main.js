Meteor.subscribe("chats");
Meteor.subscribe("users");
emojione.ascii = true;
// Router configuration

Router.configure({
  layoutTemplate: 'ApplicationLayout'
});
// specify the top level route, the page users see when they arrive at the site
Router.route('/', function () {
  if (!Meteor.user()) {
    this.render("navbar", {to: "header"});
    this.render("about", {to: "main"});
  } else {
    this.render("navbar", {to:"header"});
    this.render("lobby_page", {to:"main"});  
  }
});

Router.route('/about', function() {
  this.render("navbar", {to: "header"});
  this.render("about", {to: "main"});
});

// specify a route that allows the current user to chat to another users
Router.route('/chat/:_id', function () {
  // the user they want to chat to has id equal to 
  // the id sent in after /chat/...
  if (!Meteor.user()) {
    this.render("navbar", {to:"header"});
    this.render("not_logged_in", {to:"main"});  
  } else {
    var otherUserId = this.params._id;
    Session.set("otherUsername", Meteor.users.findOne({_id: otherUserId}).profile.username);
    // find a chat that has two users that match current user id
    // and the requested user id
    var filter = {$or:[
                {user1Id:Meteor.userId(), user2Id:otherUserId}, 
                {user2Id:Meteor.userId(), user1Id:otherUserId}
                ]};
    var chat = Chats.findOne(filter);
    console.log("Got chat obj: "+chat);
    if (!chat){// no chat matching the filter - need to insert a new one
      console.log("No chat yet, insert one.");
      Meteor.call("insertChat", Meteor.userId(), otherUserId, function(err, resp) {
        console.log("Attempting insert");
        if (err) {
          console.log("Error: " + error);
        } else {
                chatId = Chats.findOne(filter)._id;
                console.log("Called insertChat, got chatId:" + chatId);
        }
      });

      //chatId = Chats.insert({user1Id:Meteor.userId(), user2Id:otherUserId});
    }
    else {// there is a chat going already - use that. 
      chatId = chat._id;
      console.log("Got chatId:" + chatId);
    }
    if (chatId){// looking good, save the id to the session
      Session.set("chatId",chatId);
    }
    this.render("navbar", {to:"header"});
    this.render("chat_page", {to:"main"});
  }
});

// Accounts configuration
Accounts.ui.config({
  passwordSignupFields: "USERNAME_AND_EMAIL"
});

  
///
// helper functions 
/// 

Template.navbar.helpers({
  isLoggedIn: function() {
    if (Meteor.user()) {
      return true;
    } else {
      return false;
    }
  }
});

Template.nav_dropdown_users.helpers({
  users: function() {
    return Meteor.users.find();
  },
  getUsername: function(userId) {
    user = Meteor.users.findOne({_id: userId});
    return user.profile.username;
  },
  isMyUser: function(userId) {
    if (userId == Meteor.userId()) {
      return true;
    } else {
      return false;
    }
  }
})


Template.available_user_list.helpers({
  users:function(){
    return Meteor.users.find();
  },
  currentUser: function() {
    return Meteor.user().profile.username;
  }
})

Template.available_user.helpers({
  getUsername:function(userId){
    user = Meteor.users.findOne({_id:userId});
    return user.profile.username;
  }, 
  isMyUser:function(userId){
    if (userId == Meteor.userId()){
      return true;
    }
    else {
      return false;
    }
  }
})


Template.chat_page.helpers({
  messages:function(){
    var chat = Chats.findOne({_id:Session.get("chatId")});
    return chat.messages;
  }, 
  other_user:function(){
    return Session.get("otherUsername");
  }, 
  
});

Template.chat_message.helpers({
  getUsername: function(userId) {
    user = Meteor.users.findOne({_id: userId});
    return user.profile.username;
  },
  getUserPic: function(userId) {
    user = Meteor.users.findOne({_id: userId});
    return user.profile.avatar;
  },
  isMyUser: function(userId) {
    if (userId == Meteor.userId()) {
      return true;
    } else {
      return false;
    }
  }
});

Template.chat_message.rendered = function() {
  var input = document.getElementById('inputText').value;
  var output = emojione.shortnameToImage(input);
  document.getElementById('outputText').innerHTML = output;
}

Template.chat_page.events({
// this event fires when the user sends a message on the chat page
'submit .js-send-chat':function(event){
  // stop the form from triggering a page reload
  event.preventDefault();
  // see if we can find a chat object in the database
  // to which we'll add the message
  var chat = Chats.findOne({_id:Session.get("chatId")});

  if (chat){// ok - we have a chat to use
    var msgs = chat.messages; // pull the messages property
    if (!msgs){// no messages yet, create a new array
      msgs = [];
    }
    // is a good idea to insert data straight from the form
    // (i.e. the user) into the database?? certainly not. 
    // push adds the message to the end of the array
    var msgInput = event.target.chat.value;
    if (!msgInput == "") {
      msgs.push({text: event.target.chat.value,
                user_id: Meteor.user()._id });
      // reset the form
      event.target.chat.value = "";
      // put the messages array onto the chat object
      chat.messages = msgs;
      // update the chat object in the database.
      //Chats.update(chat._id, chat);
      Meteor.call("updateChat", chat._id, msgs, function(err, resp) {
        if (err) {
          console.log("Error with updateChat method call");
        }
      });
    }
  }
}
})

