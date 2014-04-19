define([
    "components/stage",
    "quick/base",
    "charts/surface",
    "utils/utils"
],function(Stage, Base, Surface, Utils){

    function SurfacePlot(selection){
	var options = this.options;
	selection.each(function(data){
	    var stage = new Stage(this);
	    stage.add(new Surface(options));
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
