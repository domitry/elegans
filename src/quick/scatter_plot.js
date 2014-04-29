define([
    "components/stage",
    "quick/base",
    "charts/scatter",
    "utils/utils"
],function(Stage, Base, Scatter, Utils){

    function ScatterPlot(selection){
	selection.each(function(data){
	    var stage = new Stage(this);
	    stage.add(new Scatter(data, options));
	    stage.render();
	});
    }

    ScatterPlot.data_name = function(_){
	this.options.name = _;
	options = this.options;
	return this;
    }

    ScatterPlot.shape = function(_){
	this.options.shape = _;
	options = this.options;
	return this;
    }

    ScatterPlot.size = function(_){
	this.options.size = _;
	options = this.options;
	return this;
    }

    ScatterPlot.stroke_width = function(_){
	this.options.stroke_width = _;
	options = this.options;
	return this;
    }

    ScatterPlot.stroke_color = function(_){
	this.options.stroke_color = _;
	options = this.options;
	return this;
    }

    ScatterPlot.fill_color = function(_){
	this.options.fill_color = _;
	options = this.options;
	return this;
    }

    ScatterPlot.has_legend = function(_){
	this.options.has_legend = _;
	options = this.options;
	return this;
    }

    Utils.mixin(ScatterPlot, Base);

    return ScatterPlot;
});
