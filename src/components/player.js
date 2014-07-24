define([
    "utils/utils",
    "utils/database"
], function(Utils, DataBase){
    function Player(element, stage, options){
	this.options = {
	    
	};

	if(arguments.length > 1){
	    Utils.merge(this.options, options);
	};

	this.model = element;
	this.stage = stage;
    };
    
    Player.prototype.render = function(){
	var range = DataBase.getRange();
	var model = this.model.append("div")
		.style("height", 27)
		.style("width", 500)
		.style("background-color", "#333");
	model.append("button")
	    .attr("title", "play")
	    .style("float", "left")
	    .text("\u25ba")
	    .on("click", function(){
		console.log("huga");
	    });

	var form = model.append("form")
	    .style("height", 30)
	    .style("width", 500);

	var thisObj = this;

	form.append("input")
	    .attr("type", "range")
	    .attr("name", "range")
	    .attr("max", range[1])
	    .attr("min", range[0])
	    .attr("value", range[0])
	    .style("width", 350)
	    .style("float", "left")
	    .on("change", function(){
		thisObj.update(this.value);
	    });

	form.append("input")
	    .attr("type", "text")
	    .style("width", 30)
	    .style("float", "left")
	    .attr("value", range[0])
	    .attr("class", "input_label");
	
	form.append("div")
	    .style("color", "#fff")
	    .append("p").style("line-height", 25)
	    .text(range[1]);
    };

    Player.prototype.update = function(val){
	DataBase.seek("", val);
	this.model.select(".input_label").attr("value", val);
	this.stage.clear();
	this.stage.update();
    };

    return Player;
});
