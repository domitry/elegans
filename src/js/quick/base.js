define([],function(){
    /********************************
      Base function of all quick functions
     **********************************/
    Base = function(){	
	this.options = {};

	// getters and setters
	this.width = function(_){
	    if(!arguments.length)return this.options.width;
	    this.options.width = _;
	};

	this.height = function(_){
	    if(!arguments.length)return this.options.height;
	    this.options.height = _;
	};

	this.bg_color = function(_){
	    if(!arguments.length)return this.options.bg_color;
	    this.options.bg_color = _;
	}

	this.legend = function(_){
	    if(!arguments.length)return this.options.legend;
	    this.options.legend = _;
	}
    }
    return Base;
});
