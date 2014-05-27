Xiangqi Viewer
==============

Xiangqi Viewer is a javascript plugin for viewing Xiangqi (象棋) games in a
browser. See the source of index.html for an example.

# Usage

Xiangqi Viewer depends on jquery and snap.svg, so include both libraries before including xiangqi\_viewer.js.

```
<script type="text/javascript" src="jquery.js"></script>
<script type="text/javascript" src="snap.svg-min.js"></script>
<script type="text/javascript" src="xiangqi_viewer.js"></script>
```

Xiangqi Viewer also has some required images. Copy the "images/xiangqi_viewer" directory into your "images" directory.

Next, initialize a XiangqiViewer.Board. 

```
<div id="xiangqi-example"></div>

<script>
  var cellSize = 55; // width of each square on the board in pixels
  var lineWidth = 2.5; // width of each line on the chessboard in pixels

  var board = new XiangqiViewer.Board('#xiangqi-example', cellSize, lineWidth);
</script>
```

Then, either place pieces on the board one by one:

```
board.place([
  {code: 'e', red: false, file: 2, rank: 0}, // Files are counted from the left, from 0 to 8, ranks are counted from the top, from 0 to 9
  {code: 'r', red: true, file: 0, rank: 8},
]);
```

The piece codes are as follows:
|r|俥|車|
-------
|h|傌|馬|
|e|相|象|
|a|仕|士|
|g|帥|將|
|p|兵|卒|
|c|炮|砲|

or use the default positioning:

```
board.defaultSetup();
```

Finally, add the list of moves:

```
board.setMoveList([
  {instruction: 'c2=5', red: true, analysis: 'This is the most common opening. It allows the cannon to control the center line.'},
  {instruction: 'c8=5', red: false, analysis: 'The parallel cannon defense.'},
  {instruction: 'h2+3', red: true, analysis: "Red's horse comes up to defend the center pawn."},
  {instruction: 'e3+1', red: false, analysis: "This is a terrible move."},
  {instruction: 'a6+5', red: true, analysis: "This is a defensive move."}
]);
```

The `analysis` field is optional, and will show up in the Notes section of the viewer for its corresponding move.
