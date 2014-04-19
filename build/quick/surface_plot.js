define([
    "components/stage",
    "quick/base",
    "charts/surface",
    "utils/utils"
],function(Stage, Base, Surface, Utils){

    function SurfacePlot(selection){
	var options = this.options;
	selection.each(function(data){
	    var stage = new Stage(selection);
	    stage.add(new Surface(data, options));
	    stage.render();
	});
    }	

    Surface.fill_colors = function(_){
	if(!arguments.length)return this.options.bg_color;
	this.options.fill_colors = _;
    }

    Utils.mixin(SurfacePlot, Base);

    return SurfacePlot;
});
