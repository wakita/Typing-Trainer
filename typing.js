// 京

var debug = true;

var g_context, $status_window, $login_name;
var $text_area, $warning_area, $input_area, $debug_area;

var frame;

var status_info = {
  login_name: 'ななしのごんべい',
  text_alphas: '',
  text_numbers: '',
  text_symbols: ''
};

function show_status() {
  $status = $('#status-window');
  var put = function (title, content) {
    $p = $('<p>').append($('<strong>').text(title));
    if (typeof content !== 'undefined') $p.append(': ' + content);
    $status.append($p);
  };
  put('Information');
  put('Name', status_info.login_name);
  put('アルファベット', status_info.text_alphas);
  put('数字', status_info.text_numbers);
  put('記号', status_info.text_symbols);
}

var readText = function () {
  var newline_rex = new RegExp(/\n/gm);
  var newlines_rex = new RegExp(/\n+/gm);
  var non_alpha_rex = new RegExp(/[^a-z]+/gim);
  var non_numel_rex = new RegExp(/[^0-9]+/gm);
  var non_symbol_rex = new RegExp(/[a-z0-9 \t\n]+/gim);

  $.post(
    'document.php',
    { command: [ 'choose_text', 'docs/pg76.txt', 500 ] },
    function (text) {
      var texts = text.split('\n');
      for (var i = 0; i < texts.length; i++) {
        $text_area.append($('<span>').attr({ id: 'line_' + (i+1) }).html(texts[i] + '<br>'));
      }

      status_info.text_alphas = text.replace(non_alpha_rex, '').length;
      status_info.text_numbers = text.replace(non_numel_rex, '').length;
      status_info.text_symbols = text.replace(non_symbol_rex, '').length;

      show_status();
    });
};

var n_cheat = 0;

var punish = function () {
  $warning_area.html($('<p>').text('ずるはいかんぜよ'));
  n_cheat++;
  var c = new Number(Math.min(n_cheat * 3, 15)).toString(16);
  $text_area.css({
      color: '#' + c + c + c,
      'font-size': '' + Math.max(100 - 10 * n_cheat, 10) + '%' });
  $warning_area.css({
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
    var cur_pos = $input_area[0].selectionStart;
    var input = $input_area.val();
    var n_lines = lines_upto(input, input.length) + 1;
    cur_line = lines_upto(input, cur_pos) + 1;

    $('#line_' + last_line).attr('class', 'unfocus');
    $('#line_' + cur_line).attr('class', 'focus');

    if (debug) {
      $debug_area.text('Key code: ' + e.keyCode +
          ', Pos : ' + cur_pos +
          ', Lines: ' + cur_line + '/' + n_lines);
    }
  }
}

$(function () {
    var $body = $(document.body);
    $login_name = $('#login_name');

    // Canvas
    var $canvas =
      $('<canvas>').attr({
          width: document.width,
          height: document.height }).appendTo($body);
    var c = $canvas[0];
    frame = { w: c.width, h: c.height, cx: c.width / 2, cy: c.height / 2 };

    g_context = c.getContext('2d');

    // Status window

    $status_window = $('<div>').attr({ id: 'status-window' })
    .appendTo($body);

    // Contents
    $contents = $('#contents-come-here');

    $text_area = $('<blockquote>').attr('id', 'text').appendTo($contents);
    $text_area.bind('copy', punish);
    $text_area.bind('contextmenu', punish);

    $warning_area = $('<div>').appendTo($contents);

    $contents.append($('<p>').text('この文章を以下に入力して下さい．'));

    $input_area =
      $('<textarea>').attr({ id: 'input', cols: 80, rows: 20 })
    .bind('keyup', input_onkeyup);
    $('<div>').append($input_area).appendTo($contents)
    $input_area.bind('paste', punish);
    $input_area.bind('contextmenu', punish);
    $input_area.bind('click', function () { start_timer(1 * 60 * 1000); });

    if (debug) {
      $body.append($('<hr>')).append($('<p>').append($('<strong>').text('Debug mode')));
      $debug_area = $('<div>').attr('id', 'debug').appendTo($body);
    }

    readText();
  });
