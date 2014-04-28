define([
    "components/stage",
    "quick/base",
    "charts/particles",
    "utils/utils"
],function(Stage, Base, Particles, Utils){

    function ParticlesPlot(selection){
	selection.each(function(data){
	    var stage = new Stage(this);
	    stage.add(new Particles(data, options));
	    stage.render();
	});
    }

    ParticlesPlot.color = function(_){
	this.options.color = _;
	options = this.options;
	return this;
    }

    ParticlesPlot.size = function(_){
	this.options.size = _;
	options = this.options;
	return this;
    }

    ParticlesPlot.has_legend = function(_){
	this.options.has_legend = _;
	options = this.options;
	return this;
    }

    Utils.mixin(ParticlesPlot, Base);

    return ParticlesPlot;
});
