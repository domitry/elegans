define([
    "components/world",
    "components/space",
    "utils/utils"
], function(World, Space, Utils){
    function Stage(element, options){
	this.options = {
	    width:700,
	    height:500,
	    world_width:500,
	    bg_color:0xffffff
	};

	if(arguments.length > 1){
	    Utils.merge(this.options, options);
	};
	
	var selection = d3.select(element);
	selection.style("width",String(this.options.width));

	this.world_space = selection.append("div")
	    .style("float","left")
	    .style("width",String(this.options.world_width))
	    .style("height",String(this.options.height));
	this.legend_space = selection.append("svg")
	    .style("float","left")
	    .style("width",String(this.options.width - this.options.world_width))
	    .style("height",String(this.options.height));
	this.charts = [];

	return this;
    }

    Stage.prototype.render = function(){
	this.world.begin(this.world_space);
    }    

    Stage.prototype.add = function(chart){
	if(this.charts.length == 0){
	    this.world = new World({
		width:this.options.world_width,
		height:this.options.height,
		bg_color:this.options.bg_color
	    });
  	    
	    this.space = new Space(chart.getDataRanges());
	    this.world.addMesh(this.space.getMeshes());
	}else{
	    // check ranges of data, and expand space if it is bigger than of data previous charts have
	    // (not implemented yet)
	}

	chart.generateMesh(this.space.getScales());
	this.world.addMesh(chart.getMesh());

	// dirty. must be modified.
	if(chart.hasLegend())chart.addLegend(this.legend_space);

	this.charts.push(chart);
    }

    return Stage;
});
