define(function(require, exports, module){
    Elegans = {};

    /***************************
      Prototype Objects for plotting
      e.g. var stage = new Elegant.Stage(d3.select("#vis"), {width:500, height:500});
           stage.add(new Elegant.Surface(data, {fill_colors:[#000000, #ffffff]}));
           stage.render();
    ****************/

    Elegans.Stage = require("components/stage");
    Elegans.Surface = require("charts/surface");
    //Elegans.Scatter = require("charts/scatter");
    //Elegans.Wireframe = require("charts/wireframe");

    /***************************
      Functions for quick plotting with method chain style  
      e.g. d3.select('#vis').datum(data).call(Elegans.SurfacePlot);
    ****************/

    Elegans.SurfacePlot = require("quick/surface_plot");
    //Elegans.ScatterPlot = require("quick/scatter_plot");
    //Elegans.WireframePlot = require("quick/wireframe_plot");

    /***************************
       Prototype Object for embedding to other language.
       e.g. var model = [{plots:[{type:"Surface",data={[...]},options={...}}],option:{...}}]
            Elegans.Embed.parse(model).render();
    ****************/

    Elegans.Embed = require("embed/embed");

    return Elegans;
});
