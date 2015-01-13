define(function(require){
	
	var Backbone 		= require('backbone'),
		highlights_tpl		= require('text!tpl/highlights.html'),
		highlights_item_view_tpl		= require('text!tpl/highlights_item.html'),
		highlights_item_view_tmp_tpl		= require('text!tpl/highlights_item_tmp.html'),
		appConfig = require('common/app-config'),
		util = require('common/utils'),
		HeaderView = require('views/HeaderView'),
		FooterView = require('views/FooterView'),
		HighlightModel = require('models/highlightModel')
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
	      			}
    };
      
	// Extends Backbone.View
    var HighlightsView = Backbone.View.extend( {
    	
        initialize: function(name) {
        	this.highlightCollection = new HighlightModel.HighlightCollection();
        	this.creator = name?name:"";
        	this.template = _.template( highlights_tpl );
        },
        
        events:{
        	"click .divHighlightItems": "clickHighlightItems",
        	"click #btnBackToItemList": "backToItemList",
        	"click .hrefAudioChatRoom": "playAudioChatRoom",
        	"click #btnMorePrevHighlight": "loadMorePrev"
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
        
        
        backToItemList: function(){
        	$("#divHighlightItemsWrapper").fadeOut('slow');
        },
        clickHighlightItems: function(event){
        	
        	if( $(event.target).hasClass('recordAudioMsg') )
        		return;
        	
        	var highlightPhotoRenders = this.highlightCollection.getHighlightPhotos( event.currentTarget.getAttribute("data-id"), 1000 );
        	
        	var max_height = $(window).height() - 140;
        	var max_width =  $(window).width();
        	
        	
        	if( highlightPhotoRenders.length>0) {
        		var photoString = "<table><tr>";
        		_.each( highlightPhotoRenders, function(render){
        			photoString+="<td><img src='"+ util.convertToHostPath('/uploads/thumb_highlight/'+render.filename)  +"' style='max-width:"+max_width+"px; max-height: "+max_height+"px'   /></td>"
        		});
        		photoString+="</tr></table>";
        		$("#divHighlightItemPhotos").html(photoString);
        	}
        	$("#divHighlightItemsWrapper").fadeIn('slow', function(){
        	   //$("#highlightContainer").css({ 'padding-top':   ( $(window).height()-70- $("#divHighlightItemPhotos").height() )/2+'px' })
        	});
        },
        
        render: function() {           
            $(this.el).html(this.template());
            var title = "My Highlights"
            if(this.creator){
            	title = 'Hightlights | ' + this.creator;
            }
            new HeaderView({ el: $(".headerContent", this.el)}).setTitle(title).render();
            new FooterView({ el: $(".footerContent", this.el)}).render();
            
            new HighlightListView({ model: this.highlightCollection });
            this.highlightCollection.fetchHighlights(this.creator);
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
 	            	});
             	} 
        	 }, 500);
        }
    });
    
    
    return HighlightsView;
   
} );


