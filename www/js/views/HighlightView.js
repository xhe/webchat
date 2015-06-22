define(function(require){
	
	var Backbone 		= require('backbone'),
		highlights_tpl		= require('text!tpl/highlights.html'),
		highlights_item_view_tpl		= require('text!tpl/highlights_item.html'),
		highlights_item_view_tmp_tpl		= require('text!tpl/highlights_item_tmp.html'),
		appConfig = require('common/app-config'),
		util = require('common/utils'),
		HeaderView = require('views/HeaderView'),
		FooterView = require('views/FooterView'),
		HighlightModel = require('models/highlightModel'),
		ContactModel = require('models/contactModel')
		;
	
	var  appendHighlight = function(highlight, lastVisited){ 
		
			if(highlight.contents!=null)
				highlight.contents= util.linkify(highlight.contents, window.platform?true:false); 
			
      		if(  $('#highlights')[0] ){
	      				 var oldscrollHeight = $('#highlights')[0].scrollHeight;
				        	 $('#highlights')
			     		 	.append( 
			 		 				$('<li>').html(
			 		 						 _.template( highlights_item_view_tpl,
			     		 								  { 
			 		 							 			photoPath: util.retrieveThumbNailPath(highlight.creator, 50), 
			 		 							 			photoLargePath: util.retrieveThumbNailPath(highlight.creator, 10000), 
			 		 							 			highlight: highlight,
			 		 							 			util: util,
			 		 							 			user: util.getLoggedInUser(),
			 		 							 			mobile: window.platform?true:false,
			 		 							 			lastVisited: lastVisited
			     		 								  }
			 		 								  )		
			 		 				)		
			 		 		);
				       	 var newscrollHeight = $('#highlights')[0].scrollHeight;
				       		 if(newscrollHeight > oldscrollHeight){ //COMPARES
				       		        $("#highlights").scrollTop($("#highlights")[0].scrollHeight); //Scrolls
				       		  }
	      	} else {
	      		$('#highlights')
     		 	.append( 
 		 				$('<li>').html(
 		 						 _.template( highlights_item_view_tpl,
     		 								  { 
 		 							 			photoPath: util.retrieveThumbNailPath(highlight.creator, 50), 
 		 							 			photoLargePath: util.retrieveThumbNailPath(highlight.creator, 10000), 
 		 							 			highlight: highlight,
 		 							 			util: util,
 		 							 			user: util.getLoggedInUser(),
 		 							 			mobile: window.platform?true:false,
		 		 							 	lastVisited: lastVisited
     		 								  }
 		 								  )		
 		 				)		
 		 		);
	      	}
      		
      		$("#txtHighlightComment_"+highlight._id).textinput().textinput("refresh");
      		$("#btnHighlightCommentConfirm_"+highlight._id).button().button("refresh");
      		$("#btnHighlightCommentCancel_"+highlight._id).button().button("refresh");
      };
      
      var  appendHighlightTmp = function(highlight){ 
    	  if(highlight.content!=null)
				highlight.content= util.linkify(highlight.content, window.platform?true:false); 
    	  
    		if(  $('#highlights')[0] ){
	      				 var oldscrollHeight = $('#highlights')[0].scrollHeight;
				        	 $('#highlights')
			     		 	.append( 
			 		 				$('<li>').html(
			 		 						 _.template( highlights_item_view_tmp_tpl,
			     		 								  { 
			 		 							 			photoPath: util.retrieveThumbNailPath(util.getLoggedInUser(), 50), 
			 		 							 			photoLargePath: util.retrieveThumbNailPath(util.getLoggedInUser(), 10000), 
			 		 							 			highlight: highlight,
			 		 							 			util: util,
			 		 							 			user: util.getLoggedInUser(),
			 		 							 			mobile: window.platform?true:false
			     		 								  }
			 		 								  )		
			 		 				)		
			 		 		);
				       	 var newscrollHeight = $('#highlights')[0].scrollHeight;
				       		 if(newscrollHeight > oldscrollHeight){ //COMPARES
				       		        $("#highlights").scrollTop($("#highlights")[0].scrollHeight); //Scrolls
				       		  }
	      			} else {
	      				 $('#highlights')
			     		 	.append( 
			 		 				$('<li>').html(
			 		 						 _.template( highlights_item_view_tmp_tpl,
			     		 								  { 
			 		 							 			photoPath: util.retrieveThumbNailPath(util.getLoggedInUser(), 50), 
			 		 							 			photoLargePath: util.retrieveThumbNailPath(util.getLoggedInUser(), 10000), 
			 		 							 			highlight: highlight,
			 		 							 			util: util,
			 		 							 			user: util.getLoggedInUser(),
			 		 							 			mobile: window.platform?true:false
			     		 								  }
			 		 								  )		
			 		 				)		
			 		 		);
	      			}
    };
      
	// Extends Backbone.View
    var HighlightsView = Backbone.View.extend( {
    	self: null,
        initialize: function(name, period_from, period_to, favorite) {
        	this.highlightCollection = new HighlightModel.HighlightCollection();
        	this.creator = name?name:"";
        	this.period_from = period_from?period_from:"";
        	this.period_to = period_to?period_to:"";
        	this.favorite = favorite?true:false;
        	this.template = _.template( highlights_tpl );
        	this.self = this;
        },
        
        events:{
        	"click .divHighlightItems": "clickHighlightItems",
        	"click #btnBackToItemList": "backToItemList",
        	"click .hrefAudioChatRoom": "playAudioChatRoom",
        	"click #btnMorePrevHighlight": "loadMorePrev",
        	"click #btnFilterHighlights": "showHighlightFilter",
        	"click #hrefCancel":"closeFilter",
        	"click #hrefSubmit": "submit",
        	"change #chkFilterPeriod":"updateFilterPeriod",
        	"change #showHightlightType":"updateShowHightlightType",
        	"click #divHighlightItemsWrapper":"backToItemList",
        	"swipeleft #divHighlightItemsWrapper":"next",
        	"swiperight #divHighlightItemsWrapper":"prev",
        	"click #btnHighligtPrev":"prev",
        	"click #btnHighligtNext":"next",
        	"click #btnHighlightBack": "backToItemList",
        	"click .divHighlighSharedLink":"clkItemLink",
        	"click .hrefFavorite": "toggleFavorite",
        	"click .spanHighlightAbstract": "showHighlightDetail",
        	"click .spanAbstractlink": "showHighlightDetail",
        	"click #divHighlightContentWrapper": "hideHighlightDetail",
        	"click .divAddCommentHighlight": "addCommentHighlight",
        	"click .btnHighlightCommentCancel": "highlightCommentCancel",
        	"click .btnHighlightCommentConfirm": "highlightCommentConfirm",
        	"click .spanHighlightCommentAbstract": "showCommentOriginal",
        	"click .spanAbstractlinkCmt": "showCommentOriginal"
        },
        
        highlightCommentConfirm: function(event){
        	var comment = $("#txtHighlightComment_"+ event.currentTarget.getAttribute("data-id")).val();
        	window.highlgihtCommentHighlightId = event.currentTarget.getAttribute("data-id");
        	this.highlightCollection.addComment(event.currentTarget.getAttribute("data-id"), comment, function(data){
        		$("#divAddComment_"+window.highlgihtCommentHighlightId).slideUp();
        		$("#txtHighlightComment_"+ window.highlgihtCommentHighlightId).val("");
        		$("#ulHighlightComments_"+window.highlgihtCommentHighlightId).append("<li>"+comment+"</li>");
        	});
        },
        
        highlightCommentCancel: function(event){
        	$("#divAddComment_"+event.currentTarget.getAttribute("data-id")).slideUp();
        	$("#txtHighlightComment_"+ event.currentTarget.getAttribute("data-id")).val("");
        },
        
        addCommentHighlight: function(event){
        	$("#divAddComment_"+event.currentTarget.getAttribute("data-id")).slideDown()
        },
        
        hideHighlightDetail: function(){
        	$("#divHighlightContentWrapper").hide('slow', function(){ 
        		$(".footerContent").show("fast", function(){});
    		});
        },
        showCommentOriginal: function(event){
        	event.preventDefault();
        	$("#divHighlightContentInner").html( $("#comment_"+event.currentTarget.getAttribute("data-id")).html());
        	$(".footerContent").hide("fast", function(){
        		$("#divHighlightContentWrapper").show('slow', function(){ 
        		});
        	});
        },
        
        showHighlightDetail: function(event){
        	event.preventDefault();
        	$("#divHighlightContentInner").html( this.highlightCollection.retrieveHighlight(event.target.getAttribute("data-id")).contents );
        	$(".footerContent").hide("fast", function(){
        		$("#divHighlightContentWrapper").show('slow', function(){ 
        		});
        	});
        },
        
        toggleFavorite: function(event){
        	$(event.currentTarget).toggleClass("favorited");
        	this.highlightCollection.favoriteHighlight(event.currentTarget.getAttribute("data-id"), function(result){
       		});
        },
        
        clkItemLink: function(event){ 
        	event.preventDefault();
        	if(event.target.getAttribute("data-id")!=='0' ){
        		HighlightModel.setCurrentHighlight( this.highlightCollection.getHighlight( event.target.getAttribute("data-id")));
        	}
        	window.location = "#highlight/"+ event.target.getAttribute("data-id")+"/link";
        },
        
        
        submit: function(){
        	//  highlights/:name/:period_from/:period_to
        	var name = "";
        	switch($("#showHightlightType").val()){
        		case "0":
        			name = util.getLoggedInUser().screenName; break;
        		case "1":
        			name = $("#selRelationship").val()=="all"?"all_families": $("#selRelationship").val(); break;
        		case "2":
        			name = $("#selRelationship").val()=="all"?"all_friends": $("#selRelationship").val(); break;
        		case "3":
        			name = "all";
        			break
        	}
        	if(name==""){
        		util.alert("Invalid selection, please modify your criteria and submit again");
        	} else {
        		var period_from = null;
            	var period_to = null;
            	if(!$("#chkFilterPeriod").is(":checked")){
            		period_from = $("#selPeriod_from_y").val()+"-"+$("#selPeriod_from_m").val()+"-"+$("#selPeriod_from_d").val();
            		period_to = $("#selPeriod_to_y").val()+"-"+$("#selPeriod_to_m").val()+"-"+$("#selPeriod_to_d").val();
            	}
            	
            	$("#divHighlightFilter").removeClass('divHighlightFilterVisible').addClass("divHighlightFilterHidden")
            	
            	window.location =  "#highlights/"+name+"/"+period_from+"/"+period_to ;
            }
        },
        
        updateShowHightlightType: function(){
        	if($("#showHightlightType").val()=="1" || $("#showHightlightType").val()=="2"){
        		ContactModel.getContacts($("#showHightlightType").val(),
        				function(contacts){
        					
		        			$("#selRelationship").empty(); 
		        			if(contacts.length==0) {
		        				$("#selRelationship").append("<option value=''>No Contact</option>");
		        			} else {
		        				$("#selRelationship").append("<option value='all'>All</option>");
			        	    }
		        			
		        			_.each(contacts, function(contact){
		        				$("#selRelationship").append("<option value='"+contact.screenName+"'>"+contact.firstName+" "+contact.lastName+"</option>");
		               	    });
		        			
		        			$("#selRelationship").selectedIndex = 0;
		       	     	  	$("#selRelationship").selectmenu("refresh");
		       				$("#divRelationList").slideDown();
		        		});
        	} else {
        		$("#divRelationList").slideUp();
        	}
        },
        
        updateFilterPeriod: function(){
        	if(!$("#chkFilterPeriod").is(":checked")){
        		$("#divPeriod").slideDown();
        	}else{
        		$("#divPeriod").slideUp();
        	}
        },
        
        closeFilter: function(){
        	$("#divHighlightFilter").removeClass('divHighlightFilterVisible').addClass("divHighlightFilterHidden");
        },
        
        showHighlightFilter: function(){
        	$("#divHighlightFilter").removeClass('divHighlightFilterHidden').addClass("divHighlightFilterVisible")
        },
        
        loadMorePrev: function(){
        	this.highlightCollection.fetchPrev(function(data){
	 				var tmpResults = JSON.parse(JSON.stringify(data.contents));
	 				if( tmpResults.length==0 )
	 				{
	 					$("#btnMorePrev").hide();
	 				}else{
	 					while(tmpResults.length>0){
	 					var highlight = tmpResults.pop();
	 					$('#highlights')
	 					 .prepend( 
	        		 			$('<li>').html(
		 		 						 _.template( highlights_item_view_tpl,
		     		 								  { 
		 		 							 			photoPath: util.retrieveThumbNailPath(highlight.creator, 50), 
		 		 							 			photoLargePath: util.retrieveThumbNailPath(highlight.creator, 10000), 
		 		 							 			highlight: highlight,
		 		 							 			util: util,
		 		 							 			user: util.getLoggedInUser(),
		 		 							 			mobile: window.platform?true:false
		     		 								  }
		 		 								  )		
		 		 				)
	 					 );
	 					}
	 				}
       	 })
        },
        
        playAudioChatRoom: function(event){
        	event.preventDefault();
        	var audioUrl = event.currentTarget.getAttribute("data-link");
        	//var media = new Media(audioUrl, function(){});
        	//media.play();
        	// Play an audio file with options (all options optional)
        	  var options = {
        	    bgColor: "#FFFFFF",
        	    //bgImage: "<SWEET_BACKGROUND_IMAGE>",
        	    bgImageScale: "fit",
        	    successCallback: function() {
        	    	if(window.platform=='android'){
        	    		window.history.back();
        	    	}
        	    },
        	    errorCallback: function(errMsg) {
        	    	window.history.back();
        	    }
        	  };
        	  window.plugins.streamingMedia.playAudio(audioUrl, options);
        	  
        },
        
        highlightPhotoRenders_s: [],
        highlightPhotoRenders_l: [],
        currentIndex: 0,
        prev: function(event){
        	event.stopPropagation();
        	if(currentIndex>0){
        		currentIndex--;
            	this.changeBigImage();
        	}
        },
        next: function(event){
        	event.stopPropagation();
        	if(currentIndex<highlightPhotoRenders_s.length-1){
        		currentIndex++;
            	this.changeBigImage();
        	}
        },
        
        backToItemList: function(){
        	$("#divHighlightItemsWrapper").fadeOut('slow');
        	$(".footerContent").show();
        	$("#imgHighlightItemBig").attr("src","");
        },
        clickHighlightItems: function(event){
        	
        	if( $(event.target).hasClass('recordAudioMsg') )
        		return;
        	
        	currentIndex = event.target.getAttribute("data-index");
        	highlightPhotoRenders_s = this.highlightCollection.getHighlightPhotos( event.currentTarget.getAttribute("data-id"), 50 );
        	highlightPhotoRenders_l = this.highlightCollection.getHighlightPhotos( event.currentTarget.getAttribute("data-id"), 1000 );
            
        	$("#imgHighlightItemBig").attr("src",util.convertToHostPath('/uploads/thumb_highlight/'+highlightPhotoRenders_s[currentIndex].filename));
        	
        	$(".footerContent").hide("fast", function(){
		        		$("#divHighlightItemsWrapper").show('slow', function(){ 
		        			$("#imgHighlightItemBig").addClass("bigImgloading");
		        			$("#imgHighlightItemBig").attr("src",util.convertToHostPath('/uploads/thumb_highlight/'+highlightPhotoRenders_l[currentIndex].filename));
		        			var img = document.getElementById('imgHighlightItemBig'); 
		        			//or however you get a handle to the IMG
		        			var width = img.clientWidth;
		        			var height = img.clientHeight;
		        			$("#imgHighlightItemBig").removeClass("bigImgloading");
		        			if(width>height){
		        				$("#imgHighlightItemBig").addClass('bigImgHorizontal');
		        				$("#imgHighlightItemBig").removeClass('bigImgVertical');
		        			} else {
		        				$("#imgHighlightItemBig").removeClass('bigImgHorizontal');
		        				$("#imgHighlightItemBig").addClass('bigImgVertical');
		        			}
		        		});
		    });
        	this.hideNavigateButton();
        },
        changeBigImage: function(){
        	$("#divHighlightItemPhotos").hide('slow', function(){
        		$("#imgHighlightItemBig").attr("src",util.convertToHostPath('/uploads/thumb_highlight/'+highlightPhotoRenders_s[currentIndex].filename));
        		$("#imgHighlightItemBig").addClass("bigImgloading");
        		$("#divHighlightItemPhotos").show('fast',function(){
        			$("#imgHighlightItemBig").attr("src",util.convertToHostPath('/uploads/thumb_highlight/'+highlightPhotoRenders_l[currentIndex].filename));
        			var img = document.getElementById('imgHighlightItemBig'); 
        			//or however you get a handle to the IMG
        			$("#imgHighlightItemBig").removeClass("bigImgloading");
        			var width = img.clientWidth;
        			var height = img.clientHeight;
        			if(width>height){
        				$("#imgHighlightItemBig").addClass('bigImgHorizontal');
        				$("#imgHighlightItemBig").removeClass('bigImgVertical');
        			} else {
        				$("#imgHighlightItemBig").removeClass('bigImgHorizontal');
        				$("#imgHighlightItemBig").addClass('bigImgVertical');
        			}
        			
        		})
        	});
        	this.hideNavigateButton();
        },
        
        hideNavigateButton: function(){
        	if(highlightPhotoRenders_s.length==1){
        		$("#btnHighligtPrev").hide();
        		$("#btnHighligtNext").hide();
        	} else if(currentIndex==0){
        		$("#btnHighligtPrev").hide();
        		$("#btnHighligtNext").show();
        	} else if(currentIndex==highlightPhotoRenders_s.length-1){
        		$("#btnHighligtNext").hide();
        		$("#btnHighligtPrev").show();
        	} else {
        		$("#btnHighligtNext").show();
        		$("#btnHighligtPrev").show();
        	}
        	
        },
        
        
        render: function() {           
            $(this.el).html(this.template({ mobileOS:window.platform }));
            var title = util.translate( "My Highlights" )
            
            if(this.favorite){
            	title = util.translate('Hightlights | Favorite');
            }
            	
            if(this.creator){
            	if(this.creator=="all_families"){
            		title =  util.translate('Hightlights | Families');
            	} else if(this.creator=="all_friends"){
            		title = util.translate('Hightlights | Friendes');
            	} else 
            		title = util.translate('Hightlights | ') + this.creator;
            }
            new HeaderView({ el: $(".headerContent", this.el)}).setTitle(title).render();
            new FooterView({ el: $(".footerContent", this.el)}).render();
            
            new HighlightListView({ model: this.highlightCollection });
            this.highlightCollection.fetchHighlights(this.creator, this.period_from, this.period_to, this.favorite);
            return this;
        }
    } );
   
    var getUnseenNumForHighlight = function(highlight, dt){
    	var total = 0;
    	_.each(highlight.comments, function(comment){
    		total+= util.datecompare( comment.created, dt ) && comment.creator._id!=util.getLoggedInUser()._id ?1:0;
    	});
    	 return total;
    };
    
    var HighlightListView = Backbone.View.extend({
    	
    	initialize: function() {
        	 this.model.on('reset', this.render);
        },
        
        render: function(){
        	 $('#highlights').empty();
        	 var _self = this;
        	 setTimeout(function(){
        		 var tmpResults = _self.result.contents;
        		 var totalUnseen = 0;
        		 for(var i=tmpResults.length-1 ; i>=0; i--){
        			 if(window.unsavedHighlight){
        				 if( window.unsavedHighlight.id!==tmpResults[i]._id ){
        					  appendHighlight(tmpResults[i], _self.result.lastVisited);
        					  totalUnseen+=getUnseenNumForHighlight(tmpResults[i], _self.result.lastVisited);
        				 } 
        			 }else{
        				  appendHighlight(tmpResults[i], _self.result.lastVisited);
        				  totalUnseen+=getUnseenNumForHighlight(tmpResults[i], _self.result.lastVisited);
        			 }
        		 }
        		 
        		 if(window.unsavedHighlight){
 	            	window.unsavedHighlight.saveData(function(){
 	            			window.unsavedHighlight = null;
 	            			$(".spanUploadingIndicator").html("Updated!")
 	            	});
 	            	HighlightModel.setCurrentHighlight(window.unsavedHighlight);
 	            	appendHighlightTmp (window.unsavedHighlight);
             	} 
        		
        		if(totalUnseen>0){
        			$("#highlights").append($("<li class='highlightUnseenNum'>").html(  totalUnseen+ " new comments") );
        			 var newscrollHeight = $('#highlights')[0].scrollHeight;
		       		 if(newscrollHeight > oldscrollHeight){ //COMPARES
		       		        $("#highlights").scrollTop($("#highlights")[0].scrollHeight); //Scrolls
		       		  }
           		} 
        		 
        	 }, 500);
        }
    });
    
    
    return HighlightsView;
   
} );


