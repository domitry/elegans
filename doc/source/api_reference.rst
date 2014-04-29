API Reference
===============

.. _import-docs:

Stage
----------------------
------------
Constructor
------------
.. code-block:: javascript

		Stage(element, options)

- element - HTML DOM Element Object
- options

------------
Methods
------------
.. code-block:: javascript

		.add(chart)

Add charts to 3-dementional space.

- chart - instance of Surface, Wireframe, Line, Particles, Scatter

.. code-block:: javascript

		.render()

Start rendering charts.

Surface
-----------------------
------------
Constructor
------------
.. code-block:: javascript

		Surface(data, options)

- data - Matrix type data
- options

  - fill_colors - Array of String

  - has_legend - Boolean 

WireFrame
-----------------------
------------
Constructor
------------
.. code-block:: javascript

		WireFrame(data, options)

- data - Matrix type data
- options

  - name - String 

  - color - String 

  - thickness - Number 

  - has_legend - Boolean 

Line
-----------------------
------------
Constructor
------------
.. code-block:: javascript

		Line(data, options)

- data - Array type data
- options

  - name - String

  - colors - Array of String

  - thickness - Number

  - has_legend - Boolean

Particles
-----------------------
------------
Constructor
------------
.. code-block:: javascript

		Particles(data, options)

- data - Array type data
- options

  - name - String

  - color - String

  - size - Number. default value is 0.3

  - has_legend - Boolean

Scatter
-----------------------
------------
Constructor
------------
.. code-block:: javascript

		Scatter(data, options)

- data - Array type data
- options

  - name - String

  - shape - String. One of "circle", "cross", "rect", and "diamond."

  - size - Number. default value is 1.5.

  - stroke_width - Number. default value is 3.

  - stroke_color - String

  - fill_color - String

  - has_legend - Boolean

SurfacePlot
-----------------------
-----------
Properties
-----------
- fill_colors - Array of String
- has_legend - Boolean

WireFramePlot
-----------------------
-----------
Properties
-----------
- data_name - String
- color - String
- thickness - Number
- has_legend - Boolean

LinePlot
-----------------------
-----------
Properties
-----------
- data_name - String
- colors - Array of String
- thickness - Number
- has_legend - Boolean

ParticlesPlot
-----------------------
-----------
Properties
-----------
- data_name - String
- color - String
- size - Number
- has_legend - Boolean

ScatterPlot
-----------------------
-----------
Properties
-----------
- data_name - String
- shape - String
- stroke_width - Number
- stroke_color - String
- fill_color - String
- has_legend - Boolean

Embed
-----------------------
-----------
Methods
-----------

.. code-block:: javascript

		.parse(model)

Parse JSON model. Return value is a instance of Elegans.Stage.
