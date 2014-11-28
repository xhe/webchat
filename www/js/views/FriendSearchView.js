define(function(require){
	
	var Backbone 		= require('backbone'),
		search_friend_tpl		= require('text!tpl/search_friend.html'),
		search_friend_result_tpl		= require('text!tpl/friend_searchresult.html'),
		refer_friend_detail_tpl		= require('text!tpl/friend_refer_detail.html'),
		appConfig = require('common/app-config'),
		util = require('common/utils'),
		HeaderView = require('views/HeaderView'),
		FooterView = require('views/FooterView'),
		User = require('models/userModel')
		;
		

	// Extends Backbone.View
    var FriendSearchView = Backbone.View.extend( {

        // The View Constructor
        initialize: function() {
        	 this.template = _.template( search_friend_tpl );
        	 this.userCollection = new User.UserCollection();
        },
        
        events:{
        	"click #btnSearch": "search"
        },
        
        search: function(){
        	var phone =  util.extractDigits($("#search_phone_number").val());
        	var email = $("#search_email").val();
        	var name = $("#search_screenName").val();
        	if( phone=="" && email=="" && name==""){
        		util.alert("Please enter searching criteria first.")
        	}else{
        		this.userCollection.search_users(phone, email, name);
        	}
        },
        
        render: function() {           
            $(this.el).html(this.template());
            new HeaderView({ el: $(".headerContent", this.el)}).setTitle("Find Friends").render();
            new FooterView({ el: $(".footerContent", this.el)}).render();
            new SearchResultView({ el: $("#divContactSearchResult", this.el), model: this.userCollection });
            
            return this;
        }
    } );
    
    var SearchResultView = Backbone.View.extend( {
    	
    	initialize:function () {
			this.model.bind("reset", this.render, this);
		},
		
		events:{
	        	"click #btnRefer": "sendRefer"
	    },
		
	    sendRefer: function(){
	    	this.model.refer(
	    			$("#search_email").val(),
	    			$("#txtReceipientName").val(),  
	    			$( "#refer_msg").val(),
	    			function(data){
	    				if(data.status=='success'){
	    					util.alert("Invitation has been sent out successfully.");
	    					$.mobile.navigate("#");
	    				}else{
	    					util.alert("Invitation can not be sent out due to following reason: \n" + data.err);
	    				}
	    			}
	    	);
	    },
		
		render: function(){
			if( this.model.users.length==0){
				if($("#search_email").val()!==""){
					$(this.el).html(_.template(refer_friend_detail_tpl));
					$( "#refer_msg").textinput();
					$("#txtReceipientName").textinput();
				}else{
					$(this.el).html(_.template( search_friend_result_tpl, { 'contacts': this.model.users, 'serverUrl': (window.hostURL?window.hostURL:"")   }));
					$( ".listview" ).listview().listview( "refresh" );
				}
			}else{
				$(this.el).html(_.template( search_friend_result_tpl, { 'contacts': this.model.users, 'serverUrl': (window.hostURL?window.hostURL:"")   }));
				$( ".listview" ).listview().listview( "refresh" );
			}
    		
		}
    	
    });
   
    return FriendSearchView;
   
} );