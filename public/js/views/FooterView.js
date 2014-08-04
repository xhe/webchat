define(function(require){
	
	var Backbone 		= require('backbone'),
		footer_tpl		= require('text!tpl/footer.html')
		util = require('common/utils')
		;
		

    var FooterView =  Backbone.View.extend( {
    	
    	render: function(){
    		$(this.el).html(_.template( footer_tpl));
		}
    });
      
   
    return FooterView;
   
} );