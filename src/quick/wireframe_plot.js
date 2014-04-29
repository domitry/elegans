define([
    "components/stage",
    "quick/base",
    "charts/wireframe",
    "utils/utils"
],function(Stage, Base, Wireframe, Utils){

    function WireframePlot(selection){
	selection.each(function(data){
	    var stage = new Stage(this);
	    stage.add(new Wireframe(data, options));
	    stage.render();
	});
    }

    WireframePlot.data_name = function(_){
	this.options.name = _;
	options = this.options;
	return this;
    }

    WireframePlot.color = function(_){
	this.options.color = _;
	options = this.options;
	return this;
    }

    WireframePlot.thickness = function(_){
	this.options.thickness = _;
	options = this.options;
	return this;
    }

    WireframePlot.has_legend = function(_){
	this.options.has_legend = _;
	options = this.options;
	return this;
    }

    Utils.mixin(WireframePlot, Base);

    return WireframePlot;
});
