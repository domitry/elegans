define([],function(){
    function Legend(){
	return this;
    }

    Legend.prototype.addContinuousColormap = function(range, color){
    	var svg = d3.select("svg");
	var scale = d3.scale.linear().domain([range[0], range[1]]).range([0,200]);

	var gradient = svg.append("svg:defs")
	    .append("svg:linearGradient")
	    .attr("id", "gradient")
	    .attr("x1", "0%")
	    .attr("x2", "0%")
	    .attr("y1", "100%")
	    .attr("y2", "0%");

	for(var i=0; i<color.length; i++){
	    gradient.append("svg:stop")
		.attr("offset", (100/color.length)*i + "%")
		.attr("stop-color", color[i]);
	}

	var group = svg.append("g");

	group.append("svg:rect")
	    .attr("width", "100%")
	    .attr("height", "100%")
	    .style("fill", "url(#gradient)");
	
	svg.append("g")
	    .attr("class", "axis")
	    .attr("transform", "translate(" + 50  + ",0)")
	    .call(d3.svg.axis(scale)
		  .scale(scale)
		  .orient("left")
		  .ticks(5));
    };

    return Legend;
});
