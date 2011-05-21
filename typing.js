// 京

// {{{ 変数宣言

var version_info = 'Version 0.02 (May 21, 2011)';
var debug = true;

var $body;
var   g_context;
var   $status_panel;
var   $control_panel;
var   $contents;
var     $text_area;
var     $warning_area;
var     $input_area;
var   $debug_area;

$(function () {
    $('#version-number').text(version_info);
    $body = $(document.body);
    $contents = $('#contents-come-here');

    $text_area = $('<blockquote>').attr('id', 'text').appendTo($contents);
    $text_area.bind('copy', punish);
    $text_area.bind('contextmenu', punish);

    $contents.append($('<p>').text('この文章を以下に入力して下さい．'));

    $status_panel = $('<div>').attr({ id: 'status-panel', 'class': 'panel' })
    .appendTo($body);
  });

var frame;

// }}}

// {{{ 情報ウィンドウの内容

var status_info = {
  login_name: 'ななしのごんべい',
  text_letters: '',
  text_alphas: '',
  text_numbers: '',
  text_symbols: '',
  seconds_to_go: ''
};

function show_status() {
  $status = $('#status-panel');
  var put = function (title, content) {
    $p = $('<p>').append($('<strong>').text(title));
    if (typeof content !== 'undefined') $p.append(': ' + content);
    $status.append($p);
  };
  put('Information');
  put('名前', status_info.login_name);
  put('総文字数', status_info.text_letters)
  put('アルファベット', status_info.text_alphas);
  put('数字', status_info.text_numbers);
  put('記号', status_info.text_symbols);
  var t = status_info.seconds_to_go;
  put('標準時間', '' + Math.floor(t / 60) + '分' + (t % 60) + '秒');
}

// }}}

// {{{ テキストの読み込みと内容の分析

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

      status_info.text_letters = text.length;
      status_info.text_alphas = text.replace(non_alpha_rex, '').length;
      status_info.text_numbers = text.replace(non_numel_rex, '').length;
      status_info.text_symbols = text.replace(non_symbol_rex, '').length;
      status_info.seconds_to_go = Math.floor(60 * (text.length / 250));

      show_status();
    });
};

// }}}

// {{{ ずるした人へのお仕置き

$(function () { $warning_area = $('<div>').appendTo($contents); });

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

// }}}

// {{{ 経過時間の描画

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

function start_timer(deadline) {
  var deadline_ms = deadline * 1000;
  var info = time_pass_visual_information;
  info.r = Math.min(frame.w, frame.h) / 2 - 30;

  var start_ms = new Date().getTime();
  var wait_ms = 1000;

  function timer(timeout) {
    var passed_ms = new Date().getTime() - start_ms;
    arc_time_passed(passed_ms / deadline_ms);

    if (passed_ms < deadline_ms) setTimeout(timer, wait_ms);
  }
  timer(wait_ms);
};

// }}}

// {{{ 入力箇所の特定と対応するテキストのハイライト

$(function () {
    $input_area =
      $('<textarea>').attr({ id: 'input', cols: 80, rows: 20 })
    .bind('keyup', input_onkeyup);
    $('<div>').append($input_area).appendTo($contents)
    $input_area.bind('paste', punish);
    $input_area.bind('contextmenu', punish);
    $input_area.bind('click', function () { start_timer(status_info.seconds_to_go); });
  });

function lines_upto(text, end) {
  l = 0;
  for (var p = 0, p2 = 0;
    p2 < end && (p2 = text.indexOf('\n', p)) >= 0;
    p = p2 + 1) {
    if (p2 < end) l++;
  }
  return l;
}

var cur_line = undefined;

function input_onkeyup(e) {
  var c = e.keyCode;
  if (!cur_line || c == 8 || c == 13 || 37 <= c && c <= 40) {
    var last_line = cur_line;
    var cur_pos = $input_area[0].selectionStart;
    var input = $input_area.val();
    var n_lines = lines_upto(input, input.length) + 1;
    cur_line = lines_upto(input, cur_pos) + 1;

    if (last_line)
      $('#line_' + last_line).attr('class', 'unfocus');
    $('#line_' + cur_line).attr('class', 'focus');

    if (debug) {
      $debug_area.text('Key code: ' + e.keyCode +
          ', Pos : ' + cur_pos +
          ', Lines: ' + cur_line + '/' + n_lines);
    }
  } else {
    arc_percent(0, 0.3, time_pass_visual_information.r, 2, '#00a');
  }
}

// }}}

// {{{ コントロールパネル

var control_panel = { };

$(function () {
    $control_panel = $('<div>').attr({ id: 'control-panel', 'class': 'panel' })
    .html($('<strong>').text('Control panel'))
    .appendTo($body);
    var put = function (title) {
    };
    [ '空白を無視する', '記号を無視する', '数字を無視する', '文字の大小を無視する' ].forEach(
      function (title) {
        $par = $('<p>').append($('<input>').attr('type', 'checkbox'))
        .append($('<strong>').text(' ' + title))
        .appendTo($control_panel);

        control_panel[title] = $('<span>').appendTo($par);
      });
})

// }}}

// {{{ 初期化

$(function () {
    var $canvas =
      $('<canvas>').attr({
          width: document.width,
          height: document.height }).appendTo($body);
    var c = $canvas[0];
    frame = { w: c.width, h: c.height, cx: c.width / 2, cy: c.height / 2 };

    g_context = c.getContext('2d');


    if (debug) {
      $body.append($('<hr>')).append($('<p>').append($('<strong>').text('Debug mode')));
      $debug_area = $('<div>').attr('id', 'debug').appendTo($body);
    }

    readText();
  });

// }}}

