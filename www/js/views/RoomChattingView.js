define(function(require){
	
	var Backbone 		= require('backbone'),
		room_chatting_view_tpl		= require('text!tpl/room_chatting_view.html'),
		room_chatting_item_view_tpl		= require('text!tpl/chatrooms_list_item.html'),
		util = require('common/utils'),
		HeaderView = require('views/HeaderView'),
		ChatMessageModel = require('models/chatMessageModel'),
		HeaderView = require('views/HeaderView'),
		FooterView = require('views/FooterView')
		;
		
	var chat_message_event_initialized = false;
	var current_roomId = null;
	
	var  appendChatMsg = function(chat){
      	if(current_roomId === chat.room ){
      			if(  $('#messages')[0] ){
      				
      				 var oldscrollHeight = $('#messages')[0].scrollHeight;
			        	 $('#messages')
		     		 	.append( 
		 		 				$('<li>').html(
		 		 						 _.template( room_chatting_item_view_tpl,
		     		 								  { 
		 		 							 			photoPath: util.retrieveThumbNailPath(chat.creator, 50), 
		 		 							 			msgPhotoPath: chat.photo? util.retrieveMsgThumbNailPath(chat.photo.renders, 100) : "", 
		 		 							 			chat: chat,
		 		 							 			user: util.getLoggedInUser() 
		     		 								  }
		 		 								  )		
		 		 				)		
		 		 			);
			        	 var newscrollHeight = $('#messages')[0].scrollHeight;
			       		 if(newscrollHeight > oldscrollHeight){ //COMPARES
			       		        $("#messages").scrollTop($("#messages")[0].scrollHeight); //Scrolls
			       		  }
      			}
		 		
			} 
      };
      
	// Extends Backbone.View
    var RoomChattingView = Backbone.View.extend( {

        // The View Constructor
        initialize: function() {
        	 this.template = _.template( room_chatting_view_tpl );
        	 this.chatMessageCollection = new ChatMessageModel.ChatMessageCollection();
        	 var _self = this;
        	  if(!chat_message_event_initialized){
        			window.socketEventService.on( window.socketEventService.EVENT_TYPE_CHATMESSAGE, 
		            			function(msg){ //alert('in room chatting view');
			        				appendChatMsg( JSON.parse(msg));
			        			}
            		);
        		 chat_message_event_initialized = true;
        	  };
        },
        
      
        
        loadMorePrev: function(){
        	this.chatMessageCollection.fetchPrev(function(data){
	 				var tmpResults = JSON.parse(JSON.stringify(data));
	 				if( tmpResults.length==0 )
	 				{
	 					$("#btnMorePrev").hide();
	 				}else{
	 					while(tmpResults.length>0){
	 					 var chat = tmpResults.pop();
	 					 var photoPath = util.retrieveThumbNailPath(chat.creator, 50);
	 					 $('#messages')
	 					 .prepend( 
	        		 				$('<li>').html(_self.template({ 
	        		 					photoPath: util.retrieveThumbNailPath(chat.creator, 50), 
	        		 					chat: chat, 
	        		 					user: util.getLoggedInUser() 	
	        		 				}))
	        		 			);
	 					}
	 				}
       	 })
        },
        
        setRoomId: function(id){
        	current_roomId = id;
        	var _self= this;
        	 setTimeout( function(){ 
        		 _self.footerView.setRoomId(current_roomId);
                 _self.chatMessageCollection.getChatMessages(id);
        	 }, 1 );
        },
       
        events: {
        	"click #btnSubmit": "sendMessage",
        	"click #btnMorePrev": "loadMorePrev",
        	"click #btnAttach": "attachMedia",
        	"click #btnAttach": "attachMedia",
        	"click #btnChattingRoomBack_phone": "chatRoomBack", 
        	"click #btnChattingRoomBack_web": "chatRoomBack", 
        	"click #btnAttPhotos": "attPhotos",
        	"click #btnAttCamera": "attCamera",
        	"submit #file-form-chat": "upload"
        },
        
        upload: function(event){
        	event.preventDefault();
        	$("#upload-button-chat").html("uploading");
        	
        	
        	var form = document.getElementById('file-form-chat');
        	var fileSelect = document.getElementById('file-select-chat');
        	var uploadButton = document.getElementById('upload-button-chat');
        	var files = fileSelect.files;
        	// Create a new FormData object.
        	var formData = new FormData();
        	
        	for(var i=0; i<files.length; i++){
        		var file = files[i];
        		if(!file.type.match('image.*'))
        			continue;        		
        		formData.append('photo', file, file.name);
        	}
        	var xhr = new XMLHttpRequest();
        	xhr.open('POST', '/api/upload_chat_file/'+current_roomId, true);
        	// Set up a handler for when the request finishes.
        	_this=this;
        	xhr.onload = function () {
        	  if (xhr.status === 200) {
        	    // File(s) uploaded.
        		  $("#upload-button-chat").html('Upload');
        	  } else {
        		  util.alert('An error occurred!');
        	  }
        	};
        	// Send the Data.
        	xhr.send(formData);
        },
        
        attPhotos: function(){
        	 window.open('photoUploader.html#type=camera&host='+window.hostURL+"&roomId="+current_roomId, '_self', 'location=no');
        },
        attCamera: function(){
        	 window.open('photoUploader.html#type=picture&host='+window.hostURL+"&roomId="+current_roomId, '_self', 'location=no');
        },
        
        attachMedia: function(){
        	$("#ctrAttach").show();
        	$("#ctrInputMsg").hide();
        },
        chatRoomBack:function(){
        	$("#ctrAttach").hide();
        	$("#ctrInputMsg").show();
        },
        
        sendMessage: function(){
        	var msg = $('#txtMsg').val();
        	$('#txtMsg').val("")
        	this.chatMessageCollection.addChatMessage(current_roomId, msg, function(chat){});
        },
        
        render: function() {  
        	
          	$(this.el).html(this.template({ user: util.getLoggedInUser(), roomId: current_roomId,  mobile: window.platform?true:false }));
          	new HeaderView({ el: $(".headerContent", this.el)}).setTitle("Chatting").render();
          	this.footerView = new FooterView({ el: $(".footerContent", this.el)}).render();
          	
            new RoomChattingListView({ model: this.chatMessageCollection});
            return this;
        }
    });
    
    var RoomChattingListView =  Backbone.View.extend({
    	 
    	initialize: function() {
         	 this.model.on('reset', this.render);
         },
         
         render: function(){
        	 this.template = _.template( room_chatting_item_view_tpl );
        	 $('#messages').empty();
        	 var tmpResults = JSON.parse(JSON.stringify(this.result));
        	 while(tmpResults.length>0){
        		 appendChatMsg(tmpResults.pop());
        	 } 
         }
    });
    
    return RoomChattingView;
   
} );