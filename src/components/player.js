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
		        .style("background-color", "#fff");

	    var thisObj = this;

	    model.append("button")
	        .attr("title", "play")
	        .style("float", "left")
	        .text("\u25ba")
	        .on("click", function(){
		        console.log("huga");
                thisObj.start();
	        });

	    var form = model.append("form")
	            .style("height", 30)
	            .style("width", 500);

	    form.append("input")
	        .attr("type", "range")
	        .attr("name", "range")
            .attr("class", "range")
	        .attr("max", range[1])
	        .attr("min", range[0])
            .attr("step", 1)
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

        this.form = form;
    };

    Player.prototype.start = function(){
        var target_player = this;
        var timer = window.setInterval("timer_func()", 400);

        window["timer_func"] = function(){
            var val, step, max;
            target_player
                .form
                .select(".range")
                .each(function(){
                    var selector = d3.select(this);
                    val = parseInt(this.value);
                    step = parseInt(selector.attr("step"));
                    max = parseInt(selector.attr("max"));
                });

            if(val+step <= max){
                console.log("called!");
                target_player.form
                    .select(".range")
                    .each(function(selector){
                        this.value = val + step;
                    });
                target_player.update(val + step);
            }else{
                window.clearInterval(timer);
            }
        };
    };

    Player.prototype.update = function(val){
	    DataBase.seek("", val);
	    this.model.select(".input_label").attr("value", val);
	    this.stage.clear();
	    this.stage.update();
    };

    return Player;
});
