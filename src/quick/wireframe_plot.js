define([
    "components/stage",
    "quick/base",
    "charts/wireframe",
    "utils/utils"
],function(Stage, Base, Wireframe, Utils){

    function WireframePlot(selection, options){
        selection.each(function(data){
            var stage = new Stage(this);
            stage.add(new Wireframe(data, options));
            stage.render();
        });
    }

    WireframePlot.data_name = function(_){
        this.options.name = _;
        return this;
    };

    WireframePlot.color = function(_){
        this.options.color = _;
        return this;
    };

    WireframePlot.thickness = function(_){
        this.options.thickness = _;
        return this;
    };

    WireframePlot.has_legend = function(_){
        this.options.has_legend = _;
        return this;
    };

    Utils.mixin(WireframePlot, Base);

    return WireframePlot;
});
