var $canvas;

var center = { x: 0, y: 0 };

function draw() {
  if (!$canvas) return false;

  var g = $canvas[0].getContext('2d');
  arc_timepassed(g, 299);
}

function arc_percent(g, start, end, radius, width, style) {
  g.beginPath();
  g.strokeStyle = style;
  g.lineWidth = 40;
  var theta1 = 2 * Math.PI * (start - 0.25);
  var theta2 = 2 * Math.PI * (end - 0.25);
  g.arc(center.x, center.y, radius, theta1, theta2, false);
  g.stroke();
}

var time_passed_radius = 180;
var time_passed_width = 40;
var timeup = 60 * 5;
function arc_timepassed(g, t) {
  var r = time_passed_radius;
  var w = time_passed_width;
  var percent = t / timeup;
  arc_percent(g, 0, Math.min(percent, 0.5), r, w, '#3b3');
  if (percent > 0.5) arc_percent(g, 0.5, Math.min(percent, t), r, w, '#ee5');
  if (percent > 0.8) arc_percent(g, 0.8, Math.min(percent, t), r, w, '#d33');
}

$(function () {
    $canvas = $('<canvas>').attr({ width: 640, height: 400 });
    center.x = 640/2; center.y = 400/2;
    $(document.body).append($canvas);
    draw();
  });
