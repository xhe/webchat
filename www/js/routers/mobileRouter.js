define(function(require){
	
	var Backbone = require('backbone'),
		HomeView = require('views/HomeView'),
		LoginView		= require('views/LoginView'),
		RegisterView		= require('views/RegisterView'),	
		PhotosView = require('views/PhotosView'),	
		PhotoView = require('views/PhotoView'),
		ChatRoomView = require('views/ChatRoomView'),
		NewChatRoomView = require('views/NewChatroomView'),
		util = require('common/utils'),
		FriendSearchView = require('views/FriendSearchView'),
		FriendRequestView = require('views/FriendRequestView'),
		RoomChattingView = require('views/RoomChattingView'),
		InvitationsView = require('views/InvitationsView'),
		InvitationView =  require('views/InvitationView'),
		ContactsView =  require('views/ContactsView'),
		LargePhotoView =  require('views/LargePhotoView'),
		DialingView = require('views/DialingView'),
		VideoChatRoom = require('views/VideoChatRoomView'),
		VideoRecorder = require('views/VideoRecorderView'),
		ForgetPasswordView = require('views/ForgetPasswordView'),
		SettingsView = require('views/SettingsView'),
		io = require("socket.io")
		;
    // Extends Backbone.Router
	return Backbone.Router.extend( {

        // The Router constructor
        initialize: function(socket) {
        	Backbone.history.start();
        },
        
        // Backbone.js Routes
        routes: {
        	 // When there is no hash bang on the url, the home method is called
            "": "home",
            "logout":"logout",
            "register":"register",
            "profiles":"register",
            "photos":"photos",
            "photo/:id":"photo",
            "chatrooms" :"chatrooms",
            "newchatroom":"newchatroom",
            "add_friend":"add_friend",
            "request_friend/:id":"request_friend",
            "chatroom/:id": "chatroom",
            "invitations": "invitations",
            "invitation/:id": "invitation",
            "contacts": "contacts",
            "invite/:roomId": "invite",
            "invite_detail/:id/:roomId": "invite_detail",
            "larget_photo/:imgPath":"larget_photo",
            "dialing/:member_id":"dialing",
            "videochat/:room": "videoChatRoom",
            "videoRecord/:room":"videoRecord",
            "forgetPassword": "forgetPassword",
            "accept_refer/:refer_id": "accept_refer",
            "settings":"settings"
        },
        
        settings : function(){
        	settingsView = new SettingsView();
        	this.changePage(settingsView);
        	return true;
        },
        
        accept_refer: function(refer_id){
        	registerView = new RegisterView(refer_id);
        	this.changePage(registerView);
        	return true;
        },
        
        forgetPassword: function(){ 
        	forgetPasswordView = new ForgetPasswordView();
        	this.changePage(forgetPasswordView);
        	return true;
        },
        
        videoRecord: function(room){
        	if (this.login())
        		return;
        	videoRecorder = new VideoRecorder(room);
        	this.changePage(videoRecorder);
        },
        
        videoChatRoom: function(room){
        	if (this.login())
        		return;
        	
        	videoChatRoom = new VideoChatRoom(room);
        	this.changePage(videoChatRoom);
        },
        
        dialing: function(member_id){
        	if (this.login())
        		return;
        	dialingView = new DialingView(member_id);
        	this.changePage(dialingView);
        },
        
        larget_photo: function(imgPath){
        	if (this.login())
        		return;
        	largePhotoView = new LargePhotoView(imgPath);
        	this.changePage(largePhotoView);
        },
        
        invite_detail: function(id,roomId){
        	if (this.login())
        		return;
        	friendRequestView = new FriendRequestView();
        	friendRequestView.setContactIdAndRoomId(id, roomId);
        	this.changePage(friendRequestView);
        },
        
        invite: function(roomId){
        	if (this.login())
        		return;
        	var contactsView = new ContactsView();
        	contactsView.setRoomId(roomId);
        	this.changePage(contactsView);
        },
        
        contacts: function(){
        	if (this.login())
        		return;
        	var contactsView = new ContactsView();
        	this.changePage(contactsView);
        },
        
        invitation: function(id){
        	if (this.login())
        		return;
        	var invitationView = new InvitationView();
        	invitationView.setId(id);
        	this.changePage(invitationView);
        },
        
        invitations: function(){
        	if (this.login())
        		return;
        	invitationsView = new InvitationsView();
        	this.changePage(invitationsView);
        },
        
        chatroom: function(id){
        	if (this.login())
        		return;
        	var roomChattingView = new RoomChattingView();
        	roomChattingView.setRoomId(id);
        	this.changePage(roomChattingView);
        },
        
        request_friend: function(id){
        	if (this.login())
        		return;
        	
        	friendRequestView = new FriendRequestView();
        	friendRequestView.setContactId(id);
        	this.changePage(friendRequestView);
        },
        
        add_friend: function(){
        	if (this.login())
        		return;
        	
        	friendSearchView = new FriendSearchView();
        	this.changePage(friendSearchView);
        },
        
        login: function(){
        	if(util.isUserLoggedIn()){
        		return false;
        	}else{  
        		loginView = new LoginView();
        		this.changePage(loginView );
        		return true;
        	}
        },
        
        register: function(){
        	registerView = new RegisterView();
        	this.changePage(registerView);
        	return true;
        },
        
        logout: function(){
        	util.logout();
        	router.navigate('#'+Math.random());
        	router.navigate('#', {trigger:true});
        },
        
        photos: function(){
        	if (this.login())
        		return;
        	
        	photosView = new PhotosView();
        	this.changePage(photosView);
        },
        // Home method
        home: function() {
        	if (this.login())
        		return;
        	
        	homeView = new HomeView();
        	this.changePage(homeView);
        },
        
        photo: function(id){
        	if (this.login())
        		return;
        	photoView = new PhotoView();
        	photoView.setPhotoId(id);
        	this.changePage(photoView);
        },
        
        chatrooms: function(){
        	if (this.login())
        		return;
        	
        	chatRoomView = new ChatRoomView();
        	this.changePage(chatRoomView);
        },
        
        newchatroom: function(){
        	if (this.login())
        		return;
        	newChatRoomView = new NewChatRoomView();
        	this.changePage(newChatRoomView);
        },
        
        changePage: function (page) {
          $(page.el).attr('data-role', 'page');
          page.render();
          $('body').append($(page.el));
          $.mobile.changePage($(page.el), {
            changeHash: false,
            reverse: false, 
            transition: this.historyCount++ ? 'flip' : 'none',
          });
        },
    } );
} );