define([
    "utils/range"
],function(Range){
    function MatrixDataset(data){
	var ranges = new Array();
	var functions = [
	    function(val){return val.x},
	    function(val){return val.y},
	    function(val){return val.z}
	];
	for(var i=0;i<3;i++){
	    ranges[i] = new Range(
		d3.max(data, function(d){return d3.max(d, functions[i])}),
		d3.min(data, function(d){return d3.min(d, functions[i])})
	    );
	}
	this.ranges = {x:ranges[0], y:ranges[1], z:ranges[2]};
	this.raw = data;
	return this;
    }

    MatrixDataset.prototype.getRanges = function(){
	return this.ranges;
    };

    function ArrayDataset(data){
	this.ranges = {};
	for(var i in data){
	    this.ranges[i] = new Range(
		d3.max(data[i], function(d){return d;}),
		d3.min(data[i], function(d){return d;})
	    );
	}
	this.raw = data;
    }

    ArrayDataset.prototype.getRanges = function(){
	return this.ranges;
    };

    Datasets = {
	Matrix:MatrixDataset,
	Array:ArrayDataset
    };

    return Datasets;
});
