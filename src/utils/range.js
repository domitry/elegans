define([],function(){
    function Range(arg0, arg1){
	if(arguments.length > 1){
	    this.max = arg0;
	    this.min = arg1;
	}else{
	    this.max  = arg0[1];
	    this.min  = arg0[0];
	}
    }

    Range.prototype.divide = function(num){
	var arr = new Array();
	var interval = Math.ceil((this.max-this.min)/(num-1));
	for(var i=0;i<num;i++){
	    arr.push(this.min + interval*i);
	}
	return arr;
    };

    Range.expand = function(range1, range2){
	return new Range(Math.max(range1.max, range2.max), Math.min(range1.min, range2.min));
    };

    return Range;
});
