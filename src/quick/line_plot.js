define([
    "components/stage",
    "quick/base",
    "charts/line",
    "utils/utils"
],function(Stage, Base, Line, Utils){

    function LinePlot(selection){
	selection.each(function(data){
	    var stage = new Stage(this);
	    stage.add(new Line(data, options));
	    stage.render();
	});
    };

    LinePlot.data_name = function(_){
	this.options.name = _;
	var options = this.options;
	return this;
    };

    LinePlot.colors = function(_){
	this.options.colors = _;
	var options = this.options;
	return this;
    };

    LinePlot.thickness = function(_){
	this.options.thickness = _;
	var options = this.options;
	return this;
    };

    LinePlot.has_legend = function(_){
	this.options.has_legend = _;
	var options = this.options;
	return this;
    };

    Utils.mixin(LinePlot, Base);

    return LinePlot;
});
