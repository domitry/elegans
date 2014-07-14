(function (root, initialize){
    var Elegans = initialize();
    if(typeof define !== "undefined" && define.amd)define(Elegans);
    root.Elegans = Elegans;
}(this, function(){
    //modules here
