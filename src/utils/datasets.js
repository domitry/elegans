define([
    "utils/range",
    "utils/database"
],function(Range, DataBase){
    function MatrixDataset(data){
	var ranges = {};
	if(typeof data == "string"){
	    this.raw = DataBase.find(data);
	}else{
	    this.raw = data;
	}
	for(var i in data){
	    ranges[i] = new Range(
		d3.max(this.raw[i], function(d){return Math.max.apply(null,d);}),
		d3.min(this.raw[i], function(d){return Math.min.apply(null,d);})
	    );
	}
	this.ranges = ranges;
	this.raw = data;
	return this;
    }


    function ArrayDataset(data){
	this.ranges = {};
	if(typeof data == "string"){
	    this.raw = DataBase.find(data);
	}else{
	    this.raw = data;
	}
	for(var i in this.raw){
	    this.ranges[i] = new Range(
		d3.max(this.raw[i]),
		d3.min(this.raw[i])
	    );
	}
    }


    var Datasets = {
	Matrix:MatrixDataset,
	Array:ArrayDataset
    };

    return Datasets;
});
