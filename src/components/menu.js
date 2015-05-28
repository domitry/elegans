define([
    "utils/utils"
], function(Utils){
    function Menu(selection, options){
	this.options = {
	    filename: "plot"
	};

	if(arguments.length > 1){
	    Utils.merge(this.options, options);
	};

	this.selection = selection;
    }

    Menu.prototype.begin = function(){
	var filename = this.options.filename;

	function removeMenu(){
	    d3.selectAll(".download_menu").remove();
	}

	function createMenu(pos, canvas){
	    removeMenu();

	    var ul = d3.select("body")
		    .append("ul")
		    .on("click", removeMenu);

	    ul.style({
		"list-style-type": "none",
		position: "absolute",
		left: pos[0] + "px",
		top: pos[1] + "px",
		background: "#f3f3f3",
		border: "1px solid #fff",
		padding: 10,
		margin: 0
	    }).attr("class", "download_menu");

	    ul.append("li")
		.append("a")
		.text("save as png")
		.attr({
		    download: filename + ".png",
		    href: canvas.toDataURL("image/png")
		});

	    ul.append("li")
		.append("a")
		.text("save as jpeg")
		.attr({
		    download: filename + ".jpg",
		    href: canvas.toDataURL("image/jpeg")
		});

	    ul.selectAll("a")
		.style({
		    display: "block",
		    "text-decoration": "none",
		    "text-align": "left",
		    "line-style": "none",
		    "color": "#333",
		    "font-size" : "13px",
		    "line-height" : "17px"
		});

	    ul.selectAll("li")
		.style({
		    "margin": 0
		});
	}

	this.selection.select("canvas")
	    .on("contextmenu", function(){
		var pos = d3.mouse(document.body);
		createMenu(pos, this, filename);
		d3.event.preventDefault();
	    })
	    .on("click", removeMenu);
    };

    return Menu;
});
