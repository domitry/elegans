define([
    "components/world",
    "components/space",
    "utils/utils",
    "utils/range"
], function(World, Space, Utils, Range){
    function Stage(element, options){
	this.options = {
	    width:700,
	    height:500,
	    world_width:500,
	    axis_labels: {x:"X", y:"Y", z:"Z"},
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

	this.world = new World({
	    width:this.options.world_width,
	    height:this.options.height,
	    bg_color:this.options.bg_color
	});

	this.data_ranges = {x:new Range(0,0),y:new Range(0,0),z:new Range(0,0)};

	return this;
    }

    Stage.prototype.add = function(chart){
        var ranges = chart.getDataRanges();
        for(var i in ranges){
            this.data_ranges[i] = Range.expand(this.data_ranges[i], ranges[i]);
	}
	this.charts.push(chart);
    }

    Stage.prototype.render = function(){
	this.space = new Space(this.data_ranges, {axis_labels:this.options.axis_labels});
	this.world.addMesh(this.space.getMeshes());
        for(var i=0;i<this.charts.length;i++){
            var chart=this.charts[i];
            chart.generateMesh(this.space.getScales());
	    this.world.addMesh(chart.getMesh());
            if(chart.hasLegend())chart.addLegend(this.legend_space);
        }
	this.world.begin(this.world_space);
    }

    return Stage;
});
