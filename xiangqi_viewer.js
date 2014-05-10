var XiangqiViewer = {}
window.XiangqiViewer = XiangqiViewer;

XiangqiViewer.BoardRenderer = function(selector, cellSize, strokeWidth) {
  var BOARD_WIDTH = 8;
  var BOARD_HEIGHT = 9;
  var BOARD_COLOR = 'rgb(6, 120, 155)';
  var MARGIN = cellSize * 0.70;

  var width = BOARD_WIDTH * cellSize + 2*MARGIN;
  var height = BOARD_HEIGHT * cellSize + 2*MARGIN;

  var LEFT_BORDER = MARGIN;
  var RIGHT_BORDER = BOARD_WIDTH * cellSize + MARGIN;
  var TOP_BORDER = MARGIN;
  var BOT_BORDER = BOARD_HEIGHT * cellSize + MARGIN;
  var RIVER_TOP = Math.floor(BOARD_HEIGHT/2) * cellSize + MARGIN;
  var RIVER_BOT = Math.ceil(BOARD_HEIGHT/2) * cellSize + MARGIN;

  var root = d3.select(selector)
  .append("svg:svg")
  .attr("width", width)
  .attr("height", height);

  this.draw = function(selector) {
    // horizontal
    drawHorizontalLines();
    drawVerticalLines(TOP_BORDER, RIVER_TOP);
    drawVerticalLines(RIVER_BOT, BOT_BORDER);
    drawBorder(LEFT_BORDER);
    drawBorder(RIGHT_BORDER);
  };

  var drawHorizontalLines = function() {
    for (var j = 0; j < BOARD_HEIGHT + 1; j++) {
      var height = MARGIN + j * cellSize;

      root.append("svg:line")
      .attr("x1", LEFT_BORDER)
      .attr("y1", height)
      .attr("x2", RIGHT_BORDER)
      .attr("y2", height)
      .style("stroke", BOARD_COLOR)
      .style("stroke-width", strokeWidth);
    };
  }

  var drawVerticalLines = function(top, bottom) {
    for (var j = 1; j < BOARD_WIDTH; j++) {
      var offset = MARGIN + j * cellSize;

      root.append("svg:line")
      .attr("x1", offset)
      .attr("y1", top)
      .attr("x2", offset)
      .attr("y2", bottom)
      .style("stroke", BOARD_COLOR)
      .style("stroke-width", strokeWidth);
    };
  }

  var drawBorder = function(x) {
    root.append("svg:line")
    .attr("x1", x)
    .attr("y1", TOP_BORDER - strokeWidth/2)
    .attr("x2", x)
    .attr("y2", BOT_BORDER + strokeWidth/2)
    .style("stroke", BOARD_COLOR)
    .style("stroke-width", strokeWidth);
  }

  return this;
};
