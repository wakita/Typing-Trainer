// 京

var debug = true;

var g_context, $login_name, $text, $warning, $input, $log;

var frame;

var newline_rex = new RegExp(/\n/gm);
var newlines_rex = new RegExp(/\n+/gm);
var non_alpha_rex = new RegExp(/[^a-z]+/gim);
var non_numel_rex = new RegExp(/[^0-9]+/gm);
var symbol_rex = new RegExp(/[a-z0-9 \t\n]+/gim);

var readText = function () {
  $.post(
    'document.php',
    { command: [ 'choose_text', 'docs/pg76.txt', 500 ] },
    function (text) {
      var texts = text.split('\n');
      for (var i = 0; i < texts.length; i++) {
        $text.append($('<span>').attr({ id: 'line_' + (i+1) }).html(texts[i] + '<br>'));
      }

      $('#n_alpha').text(text.replace(non_alpha_rex, '').length);
      $('#n_numeric').text(text.replace(non_numel_rex, '').length);
      $('#n_symbol').text(text.replace(symbol_rex, '').length);
    });
};

var n_cheat = 0;

var punish = function () {
  $warning.html($('<p>').text('ずるはいかんぜよ'));
  n_cheat++;
  var c = new Number(Math.min(n_cheat * 3, 15)).toString(16);
  $text.css({
      color: '#' + c + c + c,
      'font-size': '' + Math.max(100 - 10 * n_cheat, 10) + '%' });
  $warning.css({
      'font-size': '' + Math.max(100 + 70 * n_cheat, 10) + '%' });
  return false;
};

function arc_percent(start, end, radius, width, style) {
  var g = g_context;

  g.beginPath();
  g.strokeStyle = style;
  g.lineWidth = 40;
  var theta1 = 2 * Math.PI * (start - 0.25);
  var theta2 = 2 * Math.PI * (end - 0.25);
  g.arc(frame.cx, frame.cy, radius, theta1, theta2, false);
  g.stroke();
}

var time_pass_visual_information = { r: undefined, w: 40 };

function arc_time_passed(t) {
  var info = time_pass_visual_information;
  var r = info.r;
  var w = info.w;
  arc_percent(0, Math.min(t, 0.5), r, w, '#cdf');
  if (t > 0.5) arc_percent(0.5, t, r, w, '#ffc');
  if (t > 0.8) arc_percent(0.8, t, r, w, '#fcc');
}

function start_timer(max_ms) {
  var info = time_pass_visual_information;
  info.r = Math.min(frame.w, frame.h) / 2 - 30;

  var start_ms = new Date().getTime();
  var ms_wait = 1000;

  function timer(timeout) {
    var ms_passed = new Date().getTime() - start_ms;
    arc_time_passed(ms_passed / max_ms);

    if (ms_passed < max_ms) setTimeout(timer, ms_wait);
  }
  timer(ms_wait);
};

function lines_upto(text, end) {
  l = 0;
  for (var p = 0, p2 = 0;
    p2 < end && (p2 = text.indexOf('\n', p)) >= 0;
    p = p2 + 1) {
    if (p2 < end) l++;
  }
  return l;
}

var cur_line = 1;

function input_onkeyup(e) {
  var c = e.keyCode;
  if (c == 13 || 37 <= c && c <= 40) {
    var last_line = cur_line;
    var cur_pos = $input[0].selectionStart;
    var input = $input.val();
    var n_lines = lines_upto(input, input.length) + 1;
    cur_line = lines_upto(input, cur_pos) + 1;

    $('#line_' + last_line).attr('class', 'unfocus');
    $('#line_' + cur_line).attr('class', 'focus');

    if (debug) {
      $log.text('Key code: ' + e.keyCode +
          ', Pos : ' + cur_pos +
          ', Lines: ' + cur_line + '/' + n_lines);
    }
  }
}

$(function () {
    var $body = $(document.body);
    [ 'copy', 'paste', /*'contextmenu'*/ ].forEach (function (event) {
        $body.bind(event, punish) });

    var $canvas =
      $('<canvas>').attr({
          width: document.width,
          height: document.height }).appendTo($body);
    var c = $canvas[0];
    frame = { w: c.width, h: c.height, cx: c.width / 2, cy: c.height / 2 };

    g_context = c.getContext('2d');

    $login_name = $('#login_name');

    $text = $('<blockquote>').attr('id', 'text').appendTo($body);

    $warning = $('<div>').appendTo($body);

    $body.append($('<p>').text('この文章を以下に入力して下さい．'));

    $input =
      $('<textarea>').attr({ id: 'input', cols: 80, rows: 20 })
    .bind('keyup', input_onkeyup);
    $('<div>').append($input).appendTo($body)

    if (debug) {
      $body.append($('<hr>')).append($('<p>').append($('<strong>').text('Debug mode')));
      $log = $('<div>').attr('id', 'log').appendTo($body);
    }

    readText();
    start_timer(1 * 60 * 1000);
  });
