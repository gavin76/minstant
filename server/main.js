Meteor.publish("chats", function() {
  if (!this.userId) {
    console.log("Not logged in");
  } else {
    
    var filter = {$or:[
                {user1Id:this.userId}, {user2Id:this.userId}            
                ]};
    console.log(Chats.find(filter));
    return Chats.find(filter);
  }
});
Meteor.publish("users", function() {
  return Meteor.users.find({}, {fields: {'profile.username': 1, 'profile.avatar': 1}});
})
// start up script that creates some users for testing
// users have the username 'user1@test.com' .. 'user8@test.com'
// and the password test123 

if (!Meteor.users.findOne()){
  for (var i=1;i<9;i++){
    var email = "user"+i+"@test.com";
    var username = "user"+i;
    var avatar = "ava"+i+".png"
    console.log("creating a user with password 'test123' and username/ email: "+email);
    Meteor.users.insert({profile:{username:username, avatar:avatar}, emails:[{address:email}],services:{ password:{"bcrypt" : "$2a$10$I3erQ084OiyILTv8ybtQ4ON6wusgPbMZ6.P33zzSDei.BbDL.Q4EO"}}});
  }
} 

Meteor.methods({
  updateChat: function(chatId, chat) {
    if (!this.userId) {
      throw new Meteor.Error("not-authorized");
    } else {
    Chats.update(chatId, { $set: {messages: chat}});
  }
  },
  insertChat: function(user1Id, user2Id) {
    if (!this.userId) {
      throw new Meteor.Error("not-authorized");
    } else {
    var chatId = Chats.insert({user1Id: user1Id,
                  user2Id: user2Id});
    return true;
  }
  }
});
