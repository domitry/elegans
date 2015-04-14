define([],function(){
    function Range(arg0, arg1){
	if(arguments.length > 1){
	    this.max = arg0;
	    this.min = arg1;
	}else
	if(arguments.length > 9){	
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
		var a,b;
		if 		(typeof(range1.max)=="undefined") a=range2.max;
		else if	(typeof(range2.max)=="undefined") a=range1.max;
		else a=Math.max(range1.max, range2.max);
		
		if 		(typeof(range1.min)=="undefined") b=range2.min;
		else if	(typeof(range2.min)=="undefined") b=range1.min;
		else b=Math.max(range1.min, range2.min);
		console.log("extend",range1, range2,new Range(a,b));
		return new Range(a,b);
		
    };

    return Range;
});
