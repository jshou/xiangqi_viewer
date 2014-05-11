var XiangqiViewer = {
  BoardRenderer: function(selector, cellSize, strokeWidth) {
    var BOARD_WIDTH = 8;
    var BOARD_HEIGHT = 9;
    var BOARD_COLOR = 'rgb(6, 120, 155)';
    var MARGIN = cellSize * 0.70;
    var XSIZE = 2;

    var width = BOARD_WIDTH * cellSize + 2*MARGIN;
    var height = BOARD_HEIGHT * cellSize + 2*MARGIN;

    var leftBorder = MARGIN;
    var rightBorder = BOARD_WIDTH * cellSize + MARGIN;
    var topBorder = MARGIN;
    var botBorder = BOARD_HEIGHT * cellSize + MARGIN;
    var riverTop = Math.floor(BOARD_HEIGHT/2) * cellSize + MARGIN;
    var riverBot = Math.ceil(BOARD_HEIGHT/2) * cellSize + MARGIN;
    var dotDistance = 2 * strokeWidth;

    var root = d3.select(selector)
    .append("svg:svg")
    .attr("width", width)
    .attr("height", height);

    this.draw = function(selector) {
      // horizontal
      drawHorizontalLines();
      drawVerticalLines(topBorder, riverTop);
      drawVerticalLines(riverBot, botBorder);
      drawBorder(leftBorder);
      drawBorder(rightBorder);
      drawX(topBorder);
      drawX(botBorder - XSIZE * cellSize);

      for (var i = 2; i < 10; i += 2) {
        drawDots(i, 3, false);
        drawDots(i, 6, false);
      }

      for (var i = 0; i < 8; i += 2) {
        drawDots(i, 3, true);
        drawDots(i, 6, true);
      }
    };

    var drawHorizontalLines = function() {
      for (var j = 0; j < BOARD_HEIGHT + 1; j++) {
        var height = MARGIN + j * cellSize;

        root.append("svg:line")
        .attr("x1", leftBorder)
        .attr("y1", height)
        .attr("x2", rightBorder)
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
      .attr("y1", topBorder - strokeWidth/2)
      .attr("x2", x)
      .attr("y2", botBorder + strokeWidth/2)
      .style("stroke", BOARD_COLOR)
      .style("stroke-width", strokeWidth);
    };

    var drawX = function(top) {
      root.append("svg:line")
      .attr("x1", leftBorder + 3 * cellSize)
      .attr("y1", top)
      .attr("x2", leftBorder + (3 + XSIZE) * cellSize)
      .attr("y2", top + XSIZE * cellSize)
      .style("stroke", BOARD_COLOR)
      .style("stroke-width", strokeWidth);

      root.append("svg:line")
      .attr("x1", leftBorder + 3 * cellSize)
      .attr("y1", top + XSIZE * cellSize)
      .attr("x2", leftBorder + (3 + XSIZE) * cellSize)
      .attr("y2", top)
      .style("stroke", BOARD_COLOR)
      .style("stroke-width", strokeWidth);
    };

    // x and y are from 0 to (n - 1)
    var drawDots = function(x, y, isRight) {
      var directionMultipler = isRight ? -1 : 1;
      root.append("rect")
      .attr("x", MARGIN + x * cellSize - dotDistance * directionMultipler - (strokeWidth / 2))
      .attr("y", MARGIN + y * cellSize - dotDistance - (strokeWidth / 2))
      .attr("width", strokeWidth)
      .attr("height", strokeWidth)
      .style("fill", BOARD_COLOR);

      root.append("rect")
      .attr("x", MARGIN + x * cellSize - dotDistance  * directionMultipler - (strokeWidth / 2))
      .attr("y", MARGIN + y * cellSize + dotDistance - (strokeWidth / 2))
      .attr("width", strokeWidth)
      .attr("height", strokeWidth)
      .style("fill", BOARD_COLOR);
    };

    return this;
  },

  Board: function(selector, cellSize, strokeWidth) {
    var renderer = new XiangqiViewer.BoardRenderer(selector, cellSize, strokeWidth);
    renderer.draw();

    var WIDTH = 9
    var HEIGHT = 10
    var matrix;

    var initialize = function() {
      matrix = [];

      for(var i = 0; i < WIDTH; i++) {
        matrix[i] = [];
        for(var j = 0; j < HEIGHT; j++) {
          matrix[i][j] = null;
        }
      }
    };

    var place = function(x, y, piece) {
      if (x < 0 || y < 0 || x >= WIDTH || y >= HEIGHT) {
        throw "x, y coords are out of bounds";
      }

      matrix[x][y] = piece;
    };

    this.defaultSetup = function() {
      place(0, 0, new Chariot(true));
      place(1, 0, new Horse(true));
      place(2, 0, new Elephant(true));
      place(3, 0, new Advisor(true));
      place(4, 0, new General(true));
      place(5, 0, new Advisor(true));
      place(6, 0, new Elephant(true));
      place(7, 0, new Horse(true));
      place(8, 0, new Chariot(true));
      place(0, 3, new Pawn(true));
      place(2, 3, new Pawn(true));
      place(4, 3, new Pawn(true));
      place(6, 3, new Pawn(true));
      place(8, 3, new Pawn(true));
      place(1, 2, new Cannon(true));
      place(7, 2, new Cannon(true));

      place(0, 9, new Chariot(false));
      place(1, 9, new Horse(false));
      place(2, 9, new Elephant(false));
      place(3, 9, new Advisor(false));
      place(4, 9, new General(false));
      place(5, 9, new Advisor(false));
      place(6, 9, new Elephant(false));
      place(7, 9, new Horse(false));
      place(8, 9, new Chariot(false));
      place(0, 6, new Pawn(false));
      place(2, 6, new Pawn(false));
      place(4, 6, new Pawn(false));
      place(6, 6, new Pawn(false));
      place(8, 6, new Pawn(false));
      place(1, 7, new Cannon(false));
      place(7, 7, new Cannon(false));
    };

    initialize();
  }
}

window.XiangqiViewer = XiangqiViewer;
