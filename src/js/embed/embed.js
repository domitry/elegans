define([
    "components/stage",
    "charts/surface"
],function(Stage){
    function Embed(){
	return this;
    }

    Embed.parse = function(element_name, model){
	var selection = d3.select(element_name);
	var stage = new Stage(selection[0][0] ,model.options);
	var plots = model.plots;
	var plot_types = {
	    Surface: Surface
	};
	for(var i=0;i<plots.length;i++){
	    var plot = new (plot_types[plots[i].type])(plots[i].options);
	    stage.add(plot);
	}
	return stage;
    };

    return Embed;
});
