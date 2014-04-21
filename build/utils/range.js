define([],function(){
    function Range(max, min){
	this.max = max;
	this.min = min;
    }

    Range.prototype.divide = function(num){
	var arr = new Array();
	var interval = Math.ceil((this.max-this.min)/(num-1));
	for(var i=0;i<num;i++){
	    arr.push(this.min + interval*i);
	}
	return arr;
    }

    return Range;
});
