define([],function(){
    var mixin = function(sub, sup) {
	sup.call(sub);
    };

    var merge = function(dest, src){
	for(var key in src){
	    dest[key] = src[key];
	}
	return dest;
    };

    exports = {
	mixin:mixin,
	merge:merge
    };

    return exports;
});
