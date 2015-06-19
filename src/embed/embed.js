define([
    "components/stage",
    "charts/surface",
    "charts/wireframe",
    "charts/scatter",
    "charts/particles",
    "charts/line",
    "charts/cylinder",
    "charts/debug_object",
    "charts/volume"
],function(Stage, Surface, Wireframe, Scatter, Particles, Line, Cylinder, DebugObject, Volume){
    function Embed(){
	return this;
    }

    Embed.parse = function(element_name, model){
	var selection = d3.select(element_name);
	var stage = new Stage(selection[0][0],model.options);
	var plots = model.plots;
	var plot_types = {
	    Surface: Surface,
	    Wireframe: Wireframe,
	    Scatter: Scatter,
	    Particles: Particles,
	    Line: Line,
	    Cylinder: Cylinder,
	    DebugObject: DebugObject,
	    Volume: Volume
	};
	for(var i=0;i<plots.length;i++){
	    var plot = new (plot_types[plots[i].type])(plots[i].data,plots[i].options);
	    stage.add(plot);
	}
	return stage;
    };

    return Embed;
});
