define([
    "components/stage",
    "quick/base",
    "charts/surface",
    "utils/utils"
],function(Stage, Base, Surface, Utils){

    function SurfacePlot(selection){
	selection.each(function(data){
	    var stage = new Stage(this);
	    stage.add(new Surface(data, options));
	    stage.render();
	});
    }

    Utils.mixin(SurfacePlot, Base);

    SurfacePlot.fill_colors = function(_){
	if(!arguments.length)return this.options.bg_color;
	this.options.fill_colors = _;
	options = this.options;
	return this;
    }

    return SurfacePlot;
});
