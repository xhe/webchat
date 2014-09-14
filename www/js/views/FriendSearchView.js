define(function(require){
	
	var Backbone 		= require('backbone'),
		search_friend_tpl		= require('text!tpl/search_friend.html'),
		search_friend_result_tpl		= require('text!tpl/friend_searchresult.html'),
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
        	if( phone=="" && email=="" ){
        		alert("Please enter searching criteria first.")
        	}else{
        		this.userCollection.search_users(phone, email);
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
		
		render: function(){
    		$(this.el).html(_.template( search_friend_result_tpl, { 'contacts': this.model.users }));
    		$( ".listview" ).listview().listview( "refresh" );
		}
    	
    });
   
    return FriendSearchView;
   
} );