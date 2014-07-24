define([],function(){
    var DataBase = {lists:{}};

    // data -> [{t: 0, data: [{x:1, y:2, z:3}, ..., {x:10, y:2, z:5}]}, {t: 100, data: []}, ..., {}]
    // this.lists -> {0:[], 1:[], ..., 100:[]}
    DataBase.add = function(name, data, data_label, seek_label, init){
	var raw = {}, range=[Infinity,-Infinity];
	data.forEach(function(row){
	    var val = row[seek_label];
	    raw[row[seek_label]] = row[data_label];
	    range[0] = (val > range[0] ? range[0] : val);
	    range[1] = (val < range[1] ? range[1] : val);
	});
	this.lists[name] = {data:raw, seek:init};
	this.range = range;
    };

    DataBase.seek = function(name, seek){
	for(var n in this.lists){
	    this.lists[n].seek = seek;
	}
	//this.lists[name].seek = seek;
    };

    DataBase.getRange = function(){
	return this.range;
    };

    DataBase.find = function(name){
	var seek = this.lists[name].seek;
	return this.lists[name].data[seek];
    };

    return DataBase;
});
