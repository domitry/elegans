define([
    "components/world",
    "components/space",
    "components/player",
    "utils/utils",
    "utils/range"
], function(World, Space, Player, Utils, Range){
    function Stage(element, options){
	    this.options = {
	        width:700,
	        height:530,
	        world_width:500,
	        world_height:500,
	        axis_labels: {x:"X", y:"Y", z:"Z"},
	        bg_color:0xffffff,
	        player: false,
		space_mode: 'solid',
		range:{x:[], y:[], z:[]},  //{x:[0,0], y:[0,0], z:[0,0]}, P.S:this is not working for nagitave number. i.e: [-10,-15]
		autorange:true,
		grid: true
	    };

	    if(arguments.length > 1){
	        Utils.merge(this.options, options);
	    };
	    
	    var selection = d3.select(element);
	    selection.style("width",String(this.options.width));

	    this.world_space = selection.append("div")
	        .style("float","left")
	        .style("width",String(this.options.world_width))
	        .style("height",String(this.options.world_height));

	    this.legend_space = selection.append("div")
	        .style("float","left")
	        .style("width",String(this.options.width - this.options.world_width))
	        .style("height",String(this.options.height));

	    if(this.options.player){
	        var player_space = selection.append("div")
		            .style("width",String(this.options.width))
		            .style("height",String(this.options.height - this.options.world_height));

	        this.player = new Player(player_space, this);
	    }

	    this.charts = [];

	    this.world = new World({
	        width:this.options.world_width,
	        height:this.options.world_height,
	        bg_color:this.options.bg_color
	    });

	    this.data_ranges = {
            x:new Range(this.options.range.x[0], this.options.range.x[1]),
            y:new Range(this.options.range.y[0], this.options.range.y[1]),
            z:new Range(this.options.range.z[0], this.options.range.z[1])
        };

	    return this;
    }

    Stage.prototype.add = function(chart){
        if(this.options.autorange){
            var ranges = chart.getDataRanges();
            var thisObj=this;
            ['x', 'y', 'z'].forEach(function(i){
                thisObj.data_ranges[i] = Range.expand(thisObj.data_ranges[i], ranges[i]);
            });
        }
	this.charts.push(chart);
    };

    Stage.prototype.render = function(){
	this.space = new Space(this.data_ranges, {
	    axis_labels:this.options.axis_labels,
	    mode: this.options.space_mode,
	    grid: this.options.grid
	});
	console.log("this.data_ranges",this.data_ranges);
	this.world.addMesh(this.space.getMeshes());
        for(var i=0;i<this.charts.length;i++){
            var chart=this.charts[i];
            chart.generateMesh(this.space.getScales());
	    this.world.addMesh(chart.getMesh());
            if(chart.hasLegend()){
		var legend = chart.getLegend();
		this.legend_space[0][0].appendChild(legend[0][0]);
	    }
        }

	if(this.options.player){
	    this.player.render();
	}

	this.world.begin(this.world_space);
    };

    Stage.prototype.dispose = function(){
	this.clear();
	this.world.renderer.clear();
    };

    Stage.prototype.clear = function(){
        for(var i=0;i<this.charts.length;i++){
            var chart=this.charts[i];
	    this.world.removeMesh(chart.getMesh());
	}
    };

    Stage.prototype.update = function(){
        for(var i=0;i<this.charts.length;i++){
            var chart=this.charts[i];
            chart.generateMesh(this.space.getScales());
	    this.world.addMesh(chart.getMesh());
        }
    };

    return Stage;
});
