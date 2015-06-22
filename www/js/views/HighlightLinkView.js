define(function(require){
	
	var Backbone 		= require('backbone'),
		highlight_link_tpl	= require('text!tpl/highlight_link.html'),
		HeaderView = require('views/HeaderView'),
		FooterView = require('views/FooterView'),
		HighlightModel = require('models/highlightModel'),
		util = require('common/utils')
		;
		

	// Extends Backbone.View
    var HighlightLinkView = Backbone.View.extend( {
    	
    	highlight: null,
    	_id: null,
    	sharedLinkId: null,
    	_self: null,
    	
        // The View Constructor
        initialize: function(_id) {
        	this._id = _id;
        	 this.template = _.template( highlight_link_tpl );
        	 _self = this;
        	 
        	 this.highlightCollection = new HighlightModel.HighlightCollection();
             this.highlightCollection.on("reset", this.update);
       		 
        },

        events: {
        	"click #hrefSharedToFriend": "shareToFriend",
        	"click #hrefSharedToHighlight": "shareToHighlight",
        	//"click #hrefAddToFavorite": "addToFavorite"
       	},
       	
       	shareToFriend: function(){
       		window.location = "#sharetoroom/"+ _self.sharedLinkId;
       	},
       	
       	shareToHighlight: function(){
       		this.highlightCollection.createHighlightWithLink(_self.sharedLinkId, function(result){
       			if(result.status=='success'){
       				util.alert("You have successfully shared the link.");
       			} else {
       				util.alert("Error happened when sharing the link.");
       			}
       			window.history.back();
       		});
       		
       	},
       	
       	addToFavorite: function(){
       		this.highlightCollection.favoriteHighlight(_self._id, function(result){
       			if(result.status=='success'){
       				util.alert("You have successfully favorited this link.");
       			} else {
       				util.alert("Error happened when favoring the link.");
       			}
       			window.history.back();
       		});
       	},
       	
       	update: function(){
       		var result = this.result;
       		setTimeout(function(){
       			$("#divHighlightContent").attr('src', result.content.shared_link.link);
       			$("#headerTitle").html(result.content.shared_link.title==""?"Shared Link":result.content.shared_link.title  );
       			_self.sharedLinkId = result.content.shared_link._id;
       		}, 100);
       	},
       	
       	show: function(highlight){
       		setTimeout(function(){
       			if(typeof highlight.shared_link == "string"){
       				$("#divHighlightContent").attr('src', highlight.shared_link);
       			} else {
       				$("#divHighlightContent").attr('src', highlight.shared_link.link);
       				$("#headerTitle").html(highlight.shared_link.title==""?"Shared Link":highlight.shared_link.title  );
       				_self.sharedLinkId = highlight.shared_link._id;
       			}
       			
           	}, 1);
       	},
        render: function() { 
            $(this.el).html(this.template({ mobileOS:window.platform   }));
            new HeaderView({ el: $(".headerContent", this.el)}).setTitle( util.translate("Shared Link" )).setSharedLinkView().render();
            this.highlight = HighlightModel.getCurrentHighlight();
            _self=this;
	       	if(this.highlight==null){
	       		 this.highlightCollection.fetch(this._id);
	       	} else {
	       		this.show(this.highlight)
	       	}
	       	return this;
        }
    });
    return HighlightLinkView;
} );