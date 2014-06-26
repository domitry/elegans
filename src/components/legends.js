define([],function(){

    function generateContinuousLegend(range, color){
	var scale = d3.scale.linear().domain([range.max, range.min]).range([0,200]);

	var div = d3.select(document.createElement("div"))
	    .style("padding", "5px")
	    .style("float", "left")
	    .style("width","100")
	    .style("height","auto");
	
	var svg = div.append("svg")
	    .style("height","100%") // fixed for Mozilla Firefox Bug 736431
	    .style("width", "100px");

	var gradient = svg.append("svg:defs")
	    .append("svg:linearGradient")
	    .attr("id", "gradient")
	    .attr("x1", "0%")
	    .attr("x2", "0%")
	    .attr("y1", "100%")
	    .attr("y2", "0%");

	for(var i=0; i<color.length; i++){
	    gradient.append("svg:stop")
		.attr("offset", (100/(color.length-1))*i + "%")
		.attr("stop-color", color[i]);
	}

	var group = svg.append("g");

	group.append("svg:rect")
	    .attr("y",10)
	    .attr("width", "25")
	    .attr("height", "200")
	    .style("fill", "url(#gradient)");
	
	svg.append("g")
	    .attr("width", "100")
	    .attr("height", "200")
	    .attr("class", "axis")
	    .attr("transform", "translate(25,10)")
	    .call(d3.svg.axis()
		  .scale(scale)
		  .orient("right")
		  .ticks(5));

	svg.selectAll(".axis").selectAll("path")
	    .style("fill", "none")
	    .style("stroke", "black")
	    .style("shape-rendering", "crispEdges");

	svg.selectAll(".axis").selectAll("line")
	    .style("fill", "none")
	    .style("stroke", "black")
	    .style("shape-rendering", "crispEdges");

	svg.selectAll(".axis").selectAll("text")
	    .style("font-family", "san-serif")
	    .style("font-size", "11px");

	return div;
    };

    function generateDiscreteLegend(name, color, chart){
	var div = d3.select(document.createElement("div"))
	    .style("padding", "4")
	    .style("height","16")
	    .style("width","100%");
	
	var svg = div.append("svg")
	    .style("height","30px") // fixed for Mozilla Firefox Bug 736431
	    .style("width", "100px");
	
	var onclick_func = function(event){
	    var element = event.target;
	    if(element.getAttribute("fill-opacity")=="0.0"){
		element.setAttribute("fill-opacity","1.0");
		element.chart.appear();
	    }else{
		element.setAttribute("fill-opacity","0.0");
		element.chart.disappear();
	    }
	};

	var circle = svg.append("circle")
	    .attr("cx","8")
	    .attr("cy","8")
	    .attr("r","6")
	    .attr("stroke",color)
	    .attr("stroke-width","2")
	    .attr("fill",color)
	    .style("cursor","pointer");

	circle[0][0].chart = chart;

	circle[0][0].onclick = onclick_func;

	svg.append("text")
	    .attr("x","18")
	    .attr("y","12")
	    .attr("font-size","12")
	    .text(name);

	return div;
    }

    var Legends = {
	generateContinuousLegend:generateContinuousLegend,
	generateDiscreteLegend:generateDiscreteLegend
    };

    return Legends;
});
