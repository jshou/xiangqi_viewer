var XiangqiViewer = {}
window.XiangqiViewer = XiangqiViewer;

XiangqiViewer.BoardRenderer = function(selector, cellSize, strokeWidth) {
  var BOARD_WIDTH = 8;
  var BOARD_HEIGHT = 9;
  var BOARD_COLOR = 'rgb(6, 120, 155)';
  var HIGHLIGHT_COLOR = 'rgba(34, 139, 34, 0.7)';
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

  $(selector).append('<svg width=' + width + ' height=' + height + '/>');
  var root = Snap(selector + ' svg');
  var highlighted = [];

  this.draw = function() {
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
    root.line(x1, y1, x2, y2).attr({
      stroke: BOARD_COLOR,
      strokeWidth: strokeWidth
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
    var x1 = MARGIN + x * cellSize - dotDistance * directionMultipler - (strokeWidth / 2);
    var y1 = MARGIN + y * cellSize - dotDistance - (strokeWidth / 2);
    root.rect(x1, y1, strokeWidth, strokeWidth).attr({fill: BOARD_COLOR});

    var x2 = MARGIN + x * cellSize - dotDistance * directionMultipler - (strokeWidth / 2);
    var y2 = MARGIN + y * cellSize + dotDistance - (strokeWidth / 2);
    root.rect(x2, y2, strokeWidth, strokeWidth).attr({fill: BOARD_COLOR});
  };

  var getX = function(file) {
    return MARGIN + cellSize * file - (PIECE_SIZE / 2);
  };

  var getY = function(rank) {
    return MARGIN + cellSize * rank - (PIECE_SIZE / 2);
  };

  this.putPiece = function(file, rank, piece) {
    return root.image(piece.spriteUrl(), getX(file), getY(rank), PIECE_SIZE, PIECE_SIZE);
  }

  this.movePiece = function(file, rank, piece) {
    piece.rendered.attr({x: getX(file), y: getY(rank)});
  };

  this.highlight = function(position) {
    var x = getX(position.file) + (PIECE_SIZE / 2);
    var y = getY(position.rank) + (PIECE_SIZE / 2);

    highlighted.push(root.circle(x, y, PIECE_SIZE * 1.2 / 2)
      .attr({
        fill: 'none',
        stroke: HIGHLIGHT_COLOR,
        strokeWidth: strokeWidth,
      }));
  };

  this.highlightMove = function(move) {
    // clear existing highlights
    while (highlighted.length > 0) {
      highlighted.pop().remove();
    }

    if (move) {
      // draw new ones
      this.highlight(move.from);
      this.highlight(move.to);
    }
  };

  return this;
};

XiangqiViewer.Board = function(selector, cellSize, strokeWidth, ui) {
  var element = $(selector);
  var renderer = new XiangqiViewer.BoardRenderer(selector, cellSize, strokeWidth);
  renderer.draw();

  if (ui) {
    new XiangqiViewer.UIRenderer(element, this);
  }

  var WIDTH = 9
  var HEIGHT = 10
  var matrix;
  var history;
  var moveList;
  var currentInstruction = '';
  this.next = 0;

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

  this.highlight = renderer.highlight;

  var place = function(file, rank, piece) {
    validatePosition({file: file, rank: rank});

    matrix[file][rank] = piece;
    piece.rendered = renderer.putPiece(file, rank, piece);
  };

  var searchBackward = function(pieceCode, red) {
    for (var i = 0; i < WIDTH; i++) {
      for (var j = 0; j < HEIGHT; j++) {
        var piece = get(i, j);
        if (piece && piece.code == pieceCode && piece.red == red) {
          return {piece: piece, position: {file: i, rank: j}};
        }
      }
    }
  };

  var searchForward = function(pieceCode, red) {
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
    if (instruction[1] == '+' && red) {
      return searchBackward(instruction[0], red);
    } else if (instruction[1] == '-' && red) {
      return searchForward(instruction[0], red);
    } else if (instruction[1] == '+' && !red) {
      return searchBackward(instruction[0], red);
    } else if (instruction[1] == '-' && !red) {
      return searchForward(instruction[0], red);
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
  };

  var validatePosition = function(position) {
    if (position == null || position.file == null || position.rank == null) {
      throw "Invalid position object";
    }

    var file = position.file;
    var rank = position.rank;

    if (file < 0 || file > WIDTH - 1 || rank < 0 || rank > HEIGHT - 1){
      throw "Illegal position returned";
    }
  };

  this.setMoveList = function(moves) {
    moveList = moves;
  };

  var getMove = function(n) {
    if (n >= 0 && n < moveList.length) {
      return moveList[n];
    } else {
      return null;
    }
  };

  this.prevMove = function() {
    var lastMove = history.pop();

    if (lastMove) {
      var piece = lastMove.piece;
      var toFile = lastMove.to.file;
      var toRank = lastMove.to.rank;

      // move piece back
      matrix[lastMove.from.file][lastMove.from.rank] = piece;
      renderer.movePiece(lastMove.from.file, lastMove.from.rank, piece);

      // rerender captured piece, if any
      var capturedPiece = lastMove.capturedPiece;
      if (capturedPiece) {
        matrix[toFile][toRank] = capturedPiece;
        capturedPiece.rendered = renderer.putPiece(toFile, toRank, capturedPiece);
      } else {
        matrix[toFile][toRank] = null;
      }

      // put current instruction and analysis in return
      this.next--;
      var prevMove = getMove(this.next - 1);
      if (prevMove) {
        lastMove.prevInstruction = prevMove.instruction;
        lastMove.analysis = prevMove.analysis || '';
      } else {
        lastMove.prevInstruction = '';
        lastMove.analysis = '';
      }

      // highlight last move
      highlightLastMove();

      return lastMove;
    }
  };

  this.nextMove = function() {
    if (this.next < moveList.length) {
      var move = moveList[this.next];
      this.runMove(move.instruction, move.red, move.analysis);
      this.next++;

      return move;
    }
  };

  var highlightLastMove = function() {
    var lastMove = history[history.length - 1];
    renderer.highlightMove(lastMove);
  };

  this.runMove = function(instruction, red, analysis) {
    if (instruction.length != 4) {
      throw "illegal instruction format";
    }
    instruction = instruction.toLowerCase();

    var positionedPiece = getPositionedPiece(instruction, red);
    var move = positionedPiece.piece.getMove(positionedPiece.position, instruction);
    validatePosition(move.to);

    // remove captured piece
    var capturedPiece = get(move.to.file, move.to.rank);
    if (capturedPiece) {
      matrix[move.to.file][move.to.rank] = null;
      capturedPiece.rendered.remove();
    }

    // push to history
    history.push({
      to: move.to,
      from: move.from,
      piece: positionedPiece.piece,
      capturedPiece: capturedPiece,
      instruction: instruction,
      analysis: analysis
    });

    // update matrix
    matrix[move.from.file][move.from.rank] = null;
    matrix[move.to.file][move.to.rank] = positionedPiece.piece;

    //rerender
    renderer.movePiece(move.to.file, move.to.rank, positionedPiece.piece);

    // highlight move
    highlightLastMove();
  }

  var pieceLegend = {
    r: XiangqiViewer.Chariot,
    h: XiangqiViewer.Horse,
    e: XiangqiViewer.Elephant,
    a: XiangqiViewer.Advisor,
    k: XiangqiViewer.General,
    p: XiangqiViewer.Pawn,
    c: XiangqiViewer.Cannon
  };
  // sample positionData:
  // var positionData = [
  //   {code: 'e', red: false, file: 2, rank: 0},
  //   {code: 'r', red: true, file: 0, rank: 8},
  // ];
  this.place = function(positionData) {
    for (var i = 0; i < positionData.length; i++) {
      var d = positionData[i];
      place(d.file, d.rank, new pieceLegend[d.code](d.red));
    }
  };

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

XiangqiViewer.UIRenderer = function(element, board) {
  var moveViewer = $('<div class="xqv-move-viewer" style="position:relative;"></div>');
  var prevButton = $('<input type="button" class="xqv-prev-move" value="<-" style="float: left;">');
  var nextButton = $('<input type="button" class="xqv-next-move" value="->" style="float: left;">');
  var currentMove = $('<div class="xqv-current-move" style="float: left; margin-left: 10px;"></div>');
  var analysisLabel = $('<div class="xqv-analysis-label" style="clear: both; padding-top: 10px;">Notes:</div>');
  var analysis = $('<textarea class="xqv-analysis" style="margin-top: 10px; width: 100%; height: 100px;" readonly/>');
  moveViewer.append(prevButton);
  moveViewer.append(nextButton);
  moveViewer.append(currentMove);
  moveViewer.append(analysisLabel);
  moveViewer.append(analysis);

  prevButton.click(function() {
    var move = board.prevMove();
    analysis.text('');
    if (move) {
      currentMove.text(move.prevInstruction);
      analysis.text(move.analysis);
    }
  });

  nextButton.click(function() {
    var move = board.nextMove();
    if (move) {
      currentMove.text(move.instruction);
      analysis.text(move.analysis || '');
    }
  });

  element.append(moveViewer);
};

XiangqiViewer.Piece = function() {
  this.getFile = function(instructionFile) {
    if (this.red) {
      return 9 - instructionFile;
    } else {
      return instructionFile - 1;
    }
  };
};

XiangqiViewer.StraightMover = function() {
  var me = new XiangqiViewer.Piece();
  me.getMove = function(position, instruction) {
    var operator = instruction[2];
    var destination = parseInt(instruction[3]);
    var direction = this.red ? -1 : 1;
    var to = $.extend(true, {}, position);

    if (operator === '-') {
      to.rank -= destination * direction;
    } else if (operator === '+') {
      to.rank += destination * direction;
    } else {
      to.file = me.getFile(destination);
    }

    return {from: position, to: to};
  };

  return me;
};

XiangqiViewer.DiagonalMover = function() {
  var me = new XiangqiViewer.Piece();

  me.getMove = function(position, instruction) {
    var operator = instruction[2];
    var destination = parseInt(instruction[3]);
    var to = $.extend(true, {}, position);
    var direction = this.red ? -1 : 1;

    if (operator === '-') {
      to.rank -= this.distance * direction;
    } else {
      to.rank += this.distance * direction;
    }

    to.file = me.getFile(destination);

    return {from: position, to: to};
  };

  return me;
};

XiangqiViewer.Chariot = function(red) {
  var me = new XiangqiViewer.StraightMover();
  me.code = 'r';
  me.red = red;
  me.spriteUrl = function() {
    if (red) {
      return "/images/xiangqi_viewer/chariot_red.svg";
    } else {
      return "/images/xiangqi_viewer/chariot_black.svg";
    }
  };

  return me;
};

XiangqiViewer.Horse = function(red) {
  var me = new XiangqiViewer.Piece();
  me.code = 'h';
  me.red = red;
  me.spriteUrl = function() {
    if (red) {
      return "/images/xiangqi_viewer/horse_red.svg";
    } else {
      return "/images/xiangqi_viewer/horse_black.svg";
    }
  };

  me.getMove = function(position, instruction) {
    var operator = instruction[2];
    var destination = parseInt(instruction[3]);
    var to = $.extend(true, {}, position);

    to.file = me.getFile(instruction[3]);
    var difference = Math.abs(position.file - to.file);
    var advance = difference % 2 + 1
    var direction = red ? -1 : 1;

    if (operator === '+') {
      to.rank += advance * direction;
    } else {
      to.rank -= advance * direction;
    }

    return {from: position, to: to};
  };

  return me;
};

XiangqiViewer.Elephant = function(red) {
  var me = new XiangqiViewer.DiagonalMover();
  me.code = 'e';
  me.red = red;
  me.distance = 2;
  me.spriteUrl = function() {
    if (red) {
      return "/images/xiangqi_viewer/elephant_red.svg";
    } else {
      return "/images/xiangqi_viewer/elephant_black.svg";
    }
  };

  return me;
};

XiangqiViewer.Advisor = function(red) {
  var me = new XiangqiViewer.DiagonalMover();
  me.code = 'a';
  me.red = red;
  me.distance = 1;
  me.spriteUrl = function() {
    if (red) {
      return "/images/xiangqi_viewer/adviser_red.svg";
    } else {
      return "/images/xiangqi_viewer/adviser_black.svg";
    }
  };

  return me;
};

XiangqiViewer.General = function(red) {
  var me = new XiangqiViewer.StraightMover();
  me.code = 'k';
  me.red = red;
  me.spriteUrl = function() {
    if (red) {
      return "/images/xiangqi_viewer/general_red.svg";
    } else {
      return "/images/xiangqi_viewer/general_black.svg";
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
      return "/images/xiangqi_viewer/pawn_red.svg";
    } else {
      return "/images/xiangqi_viewer/pawn_black.svg";
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
      return "/images/xiangqi_viewer/cannon_red.svg";
    } else {
      return "/images/xiangqi_viewer/cannon_black.svg";
    }
  };

  return me;
};
