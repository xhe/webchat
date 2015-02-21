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
	
	
	
	var  appendHighlight = function(highlight){ 
		 
		 
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
      };
      
      var  appendHighlightTmp = function(highlight){ 
    	  
    	  
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
    	
        initialize: function(name, period_from, period_to) {
        	this.highlightCollection = new HighlightModel.HighlightCollection();
        	this.creator = name?name:"";
        	this.period_from = period_from?period_from:"";
        	this.period_to = period_to?period_to:"";
        	this.template = _.template( highlights_tpl );
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
        	"click #btnHighlightBack": "backToItemList"
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
            	
            	//$.mobile.navigate("#highlights/"+name+"/"+period_from+"/"+period_to);
           
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
        	
        	currentIndex = 0;
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
            var title = "My Highlights"
            if(this.creator){
            	if(this.creator=="all_families"){
            		title = 'Hightlights | Families';
            	} else if(this.creator=="all_friends"){
            		title = 'Hightlights | Friendes';
            	} else 
            		title = 'Hightlights | ' + this.creator;
            }
            new HeaderView({ el: $(".headerContent", this.el)}).setTitle(title).render();
            new FooterView({ el: $(".footerContent", this.el)}).render();
            
            new HighlightListView({ model: this.highlightCollection });
            this.highlightCollection.fetchHighlights(this.creator, this.period_from, this.period_to);
            return this;
        }
    } );
   
    var HighlightListView = Backbone.View.extend({
    	
    	initialize: function() {
        	 this.model.on('reset', this.render);
        },
        
        render: function(){
        	 $('#highlights').empty();
        	 var _self = this;
        	 setTimeout(function(){
        		 var tmpResults = _self.result.contents;
        		 for(var i=tmpResults.length-1 ; i>=0; i--){
        			 if(window.unsavedHighlight){
        				 if( window.unsavedHighlight.id!==tmpResults[i]._id ){
        					  appendHighlight(tmpResults[i]);
        				 } 
        			 }else{
        				  appendHighlight(tmpResults[i]);
        			 }
        		 }
        		 if(window.unsavedHighlight){
             		appendHighlightTmp (window.unsavedHighlight);
 	            	window.unsavedHighlight.saveData(function(){
 	            			window.unsavedHighlight = null;
 	            			$(".spanUploadingIndicator").html("Updated!")
 	            	});
             	} 
        	 }, 500);
        }
    });
    
    
    return HighlightsView;
   
} );


