define([],function(){
    /********************************
      Base function of all quick functions
     **********************************/
    Base = function(){
	options = {};
	this.options = {};

	//setters
	this.width = function(_){
	    this.options.width = _;
	    options = this.options;
	    return this;
	};

	this.height = function(_){
	    this.options.height = _;
	    options = this.options;
	    return this;
	};

	this.bg_color = function(_){
	    this.options.bg_color = _;
	    options = this.options;
	    return this;
	}

	this.legend = function(_){
	    this.options.legend = _;
	    options = this.options;
	    return this;
	}
    }
    return Base;
});
