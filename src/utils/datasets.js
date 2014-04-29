define([
    "utils/range"
],function(Range){
    function MatrixDataset(data){
	var ranges = {};
	for(i in data){
	    ranges[i] = new Range(
		d3.max(data[i], function(d){return Math.max.apply(null,d);}),
		d3.min(data[i], function(d){return Math.min.apply(null,d);})
	    );
	}
	this.ranges = ranges;
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
