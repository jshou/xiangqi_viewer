var XiangqiViewer = {}
window.XiangqiViewer = XiangqiViewer;

XiangqiViewer.BoardRenderer = function(element, cellSize, strokeWidth) {
  var BOARD_WIDTH = 8;
  var BOARD_HEIGHT = 9;
  var BOARD_COLOR = 'rgb(6, 120, 155)';
  var MARGIN = cellSize * 0.70;
  var XSIZE = 2;
  var PIECE_SIZE = 0.85 * cellSize;

  var width = BOARD_WIDTH * cellSize + 2*MARGIN;
  var height = BOARD_HEIGHT * cellSize + 2*MARGIN;

  var leftBorder = MARGIN;
  var rightBorder = BOARD_WIDTH * cellSize + MARGIN;
  var topBorder = MARGIN;
  var botBorder = BOARD_HEIGHT * cellSize + MARGIN;
  var riverTop = Math.floor(BOARD_HEIGHT/2) * cellSize + MARGIN;
  var riverBot = Math.ceil(BOARD_HEIGHT/2) * cellSize + MARGIN;
  var dotDistance = 2 * strokeWidth;

  var root = SVG('xiangqi-example').width(width).height(height);

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

  var drawBoardLine = function(x1, y1, x2, y2) {
    root.line(x1, y1, x2, y2).stroke({
      color: BOARD_COLOR,
      width: strokeWidth
    });
  };

  var drawHorizontalLines = function() {
    for (var j = 0; j < BOARD_HEIGHT + 1; j++) {
      var height = MARGIN + j * cellSize;

      drawBoardLine(leftBorder, height, rightBorder, height);
    };
  }

  var drawVerticalLines = function(top, bottom) {
    for (var j = 1; j < BOARD_WIDTH; j++) {
      var offset = MARGIN + j * cellSize;

      drawBoardLine(offset, top, offset, bottom);
    };
  }

  var drawBorder = function(x) {
    drawBoardLine(x, topBorder - strokeWidth/2, x, botBorder + strokeWidth/2);
  };

  var drawX = function(top) {
    var leftEdge = leftBorder + 3 * cellSize;
    var rightEdge = leftBorder + (3 + XSIZE) * cellSize;
    var bot = top + XSIZE * cellSize;
    drawBoardLine(leftEdge, top, rightEdge, bot);
    drawBoardLine(leftEdge, bot, rightEdge, top);
  };

  // x and y are from 0 to (n - 1)
  var drawDots = function(x, y, isRight) {
    var directionMultipler = isRight ? -1 : 1;
    root.rect(strokeWidth, strokeWidth).move(
      MARGIN + x * cellSize - dotDistance * directionMultipler - (strokeWidth / 2),
      MARGIN + y * cellSize - dotDistance - (strokeWidth / 2)
    ).attr({fill: BOARD_COLOR});

    root.rect(strokeWidth, strokeWidth).move(
      MARGIN + x * cellSize - dotDistance * directionMultipler - (strokeWidth / 2),
      MARGIN + y * cellSize + dotDistance - (strokeWidth / 2)
    ).attr({fill: BOARD_COLOR});
  };

  var getX = function(file) {
    return MARGIN + cellSize * file - (PIECE_SIZE / 2);
  };

  var getY = function(rank) {
    return MARGIN + cellSize * rank - (PIECE_SIZE / 2);
  };

  this.putPiece = function(file, rank, piece) {
    return root.image(piece.spriteUrl())
      .move(getX(file), getY(rank))
      .attr({
        width: PIECE_SIZE,
        height: PIECE_SIZE
      });
  }

  this.movePiece = function(file, rank, piece) {
    piece.rendered.move(getX(file), getY(rank));
  };

  return this;
};

XiangqiViewer.Board = function(selector, cellSize, strokeWidth) {
  var renderer = new XiangqiViewer.BoardRenderer(selector, cellSize, strokeWidth);
  renderer.draw();

  var WIDTH = 9
  var HEIGHT = 10
  var matrix;
  var history;

  var initialize = function() {
    history = [];
    matrix = []; // rank, file; x, y

    for(var i = 0; i < WIDTH; i++) {
      matrix[i] = [];
      for(var j = 0; j < HEIGHT; j++) {
        matrix[i][j] = null;
      }
    }
  };

  var get = function(file, rank) {
    return matrix[file][rank];
  };

  var place = function(x, y, piece) {
    if (x < 0 || y < 0 || x >= WIDTH || y >= HEIGHT) {
      throw "x, y coords are out of bounds";
    }

    matrix[x][y] = piece;
    piece.rendered = renderer.putPiece(x, y, piece);
  };

  var searchForward = function(pieceCode, red) {
    for (var i = 0; i < WIDTH; i++) {
      for (var j = 0; j < HEIGHT; j++) {
        var piece = get(i, j);
        if (piece && piece.code == pieceCode) {
          return {piece: piece, position: {file: i, rank: j}};
        }
      }
    }
  };

  var searchBackward = function(pieceCode, red) {
    for (var i = 0; i < WIDTH; i++) {
      for (var j = HEIGHT - 1; j >= 0; j--) {
        var piece = get(i, j);
        if (piece && piece.code == pieceCode && piece.red == red) {
          return {piece: piece, position: {file: i, rank: j}};
        }
      }
    }
  };

  var getPositionedPiece = function(instruction, red) {
    if (instruction[0] == 'f' && red) {
      return searchBackward(instruction[1], red);
    } else if (instruction[0] == 'b' && red) {
      return searchForward(instruction[1], red);
    } else if (instruction[0] == 'f' && !red) {
      return searchBackward(instruction[1], red);
    } else if (instruction[0] == 'b' && !red) {
      return searchForward(instruction[1], red);
    } else {
      var instructionPiece = instruction[0];
      var file;
      if (red) {
        file = 9 - parseInt(instruction[1]);
      } else {
        file = parseInt(instruction[1]) - 1;
      }

      for (var i = 0; i < HEIGHT; i++) {
        var piece = get(file, i);
        if (piece && piece.code == instructionPiece && piece.red == red) {
          return {piece: piece, position: {file: file, rank: i}};
        }
      }

      throw "no piece on this file";
    }
  }

  this.runMove = function(instruction, red) {
    if (instruction.length != 4) {
      throw "illegal instruction format";
    }
    instruction = instruction.toLowerCase();

    var positionedPiece = getPositionedPiece(instruction, red);
    var move = positionedPiece.piece.getMove(positionedPiece.position, instruction);

    // remove captured piece
    var capturedPiece = get(move.to.file, move.to.rank);
    if (capturedPiece) {
      matrix[move.to.file][move.to.rank] = null;
      capturedPiece.rendered.remove();
    }

    // push to history
    history.push({from: move.from, to: move.to, capturedPiece: capturedPiece});

    // update matrix
    matrix[move.from.file][move.from.rank] = null;
    matrix[move.to.file][move.to.rank] = positionedPiece.piece;

    //rerender
    renderer.movePiece(move.to.file, move.to.rank, positionedPiece.piece);
  }

  this.defaultSetup = function() {
    place(0, 0, new XiangqiViewer.Chariot(false));
    place(1, 0, new XiangqiViewer.Horse(false));
    place(2, 0, new XiangqiViewer.Elephant(false));
    place(3, 0, new XiangqiViewer.Advisor(false));
    place(4, 0, new XiangqiViewer.General(false));
    place(5, 0, new XiangqiViewer.Advisor(false));
    place(6, 0, new XiangqiViewer.Elephant(false));
    place(7, 0, new XiangqiViewer.Horse(false));
    place(8, 0, new XiangqiViewer.Chariot(false));
    place(0, 3, new XiangqiViewer.Pawn(false));
    place(2, 3, new XiangqiViewer.Pawn(false));
    place(4, 3, new XiangqiViewer.Pawn(false));
    place(6, 3, new XiangqiViewer.Pawn(false));
    place(8, 3, new XiangqiViewer.Pawn(false));
    place(1, 2, new XiangqiViewer.Cannon(false));
    place(7, 2, new XiangqiViewer.Cannon(false));

    place(0, 9, new XiangqiViewer.Chariot(true));
    place(1, 9, new XiangqiViewer.Horse(true));
    place(2, 9, new XiangqiViewer.Elephant(true));
    place(3, 9, new XiangqiViewer.Advisor(true));
    place(4, 9, new XiangqiViewer.General(true));
    place(5, 9, new XiangqiViewer.Advisor(true));
    place(6, 9, new XiangqiViewer.Elephant(true));
    place(7, 9, new XiangqiViewer.Horse(true));
    place(8, 9, new XiangqiViewer.Chariot(true));
    place(0, 6, new XiangqiViewer.Pawn(true));
    place(2, 6, new XiangqiViewer.Pawn(true));
    place(4, 6, new XiangqiViewer.Pawn(true));
    place(6, 6, new XiangqiViewer.Pawn(true));
    place(8, 6, new XiangqiViewer.Pawn(true));
    place(1, 7, new XiangqiViewer.Cannon(true));
    place(7, 7, new XiangqiViewer.Cannon(true));
  };

  initialize();
}

XiangqiViewer.StraightMover = function() {
  this.getMove = function(position, instruction) {
    var operator = instruction[2];
    var destination = parseInt(instruction[3]);
    var to = $.extend(true, {}, position);

    if (operator === '-') {
      if (this.red) {
        to.rank += destination;
      } else {
        to.rank -= destination;
      }
    } else if (operator === '+') {
      if (this.red) {
        to.rank -= destination;
      } else {
        to.rank += destination;
      }
    } else {
      if (this.red) {
        to.file = 9 - destination;
      } else {
        to = destination - 1;
      }
    }

    return {from: position, to: to};
  };
};

XiangqiViewer.Chariot = function(red) {
  var me = new XiangqiViewer.StraightMover();
  me.code = 'r';
  me.red = red;
  me.spriteUrl = function() {
    if (red) {
      return "images/chariot_red.svg";
    } else {
      return "images/chariot_black.svg";
    }
  };

  return me;
};

XiangqiViewer.Horse = function(red) {
  this.code = 'h';
  this.red = red;
  this.spriteUrl = function() {
    if (red) {
      return "images/horse_red.svg";
    } else {
      return "images/horse_black.svg";
    }
  };

  this.getMove = function(position, instruction) {
  };
};

XiangqiViewer.Elephant = function(red) {
  this.code = 'e';
  this.red = red;
  this.spriteUrl = function() {
    if (red) {
      return "images/elephant_red.svg";
    } else {
      return "images/elephant_black.svg";
    }
  };

  this.getMove = function(position, instruction) {
  };
};

XiangqiViewer.Advisor = function(red) {
  this.code = 'a';
  this.red = red;
  this.spriteUrl = function() {
    if (red) {
      return "images/adviser_red.svg";
    } else {
      return "images/adviser_black.svg";
    }
  };

  this.getMove = function(position, instruction) {
  };
};

XiangqiViewer.General = function(red) {
  var me = new XiangqiViewer.StraightMover();
  me.code = 'g';
  me.red = red;
  me.spriteUrl = function() {
    if (red) {
      return "images/general_red.svg";
    } else {
      return "images/general_black.svg";
    }
  };

  return me;
};

XiangqiViewer.Pawn = function(red) {
  var me = new XiangqiViewer.StraightMover();
  me.code = 'p';
  me.red = red;
  me.spriteUrl = function() {
    if (red) {
      return "images/pawn_red.svg";
    } else {
      return "images/pawn_black.svg";
    }
  };

  return me;
};

XiangqiViewer.Cannon = function(red) {
  var me = new XiangqiViewer.StraightMover();
  me.code = 'c';
  me.red = red;
  me.spriteUrl = function() {
    if (red) {
      return "images/cannon_red.svg";
    } else {
      return "images/cannon_black.svg";
    }
  };

  return me;
};
