// 京

// {{{ 変数宣言

var version_info = 'Version 0.03 (May 26, 2011)';
var debug = false;

var competition_mode = false;
var local_storage_cl_typing_your_ID = localStorage.cl_typing_your_ID;
var $body;
var   g_context;
var   $panels;
var     $your_ID;
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

    $panels = $('<div>').attr({ id: 'panels' }).appendTo($body);

    $panels.status =
      ($('<div>').attr({ 'class': 'panel' }).appendTo($panels));

    $panels.control =
      ($('<div>').attr({ 'class': 'panel' }).appendTo($panels));

    $panels.result =
      ($('<div>').attr({ 'class': 'panel' }).appendTo($panels));
  });

var frame;

// }}}

// {{{ 情報ウィンドウの内容

var status_info = {
  login_name: '',
  text_letters: '',
  text_alphas: '',
  text_numbers: '',
  text_symbols: '',
  seconds_to_go: ''
};

function show_status() {
  $panels.status.children('table').remove();
  var $table = $('<table>').appendTo($panels.status);
  $('<thead>').append($('<tr>').append($('<th>').text('情報').attr('colspan', 2))).appendTo($table);
  $tbody = $('<tbody>').appendTo($table);

  if (competition_mode) {
    $your_ID = $('<input>').attr({ 'type': 'textfield' });
    ($('<tr>')
      .append($('<td>').append($('<strong>').text('ログイン名')))
      .append($your_ID))
    .appendTo($tbody);
    if (localStorage.cl_typing_your_ID) {
      $your_ID.val(localStorage.cl_typing_your_ID);
    }
  }

  var put = function (title, content) {
    ($('<tr>')
      .append($('<td>').append($('<strong>').text(title)))
      .append($('<td>').text(content)))
    .appendTo($tbody);
  };

  put('総文字数', status_info.text_letters)
  put('アルファベット', status_info.text_alphas);
  put('数字', status_info.text_numbers);
  put('記号', status_info.text_symbols);
  var t = status_info.seconds_to_go;
  put('標準時間', '' + Math.floor(t / 60) + '分' + (t % 60) + '秒');
}

// }}}

// {{{ テキストの読み込みと内容の分析

var assignment;

var read_text = function (path, size, offset) {
  path = path || 'docs/pg1661.txt';
  size = size || 300;
  offset = offset || -1;

  var newline_rex = new RegExp(/\n/gm);
  var newlines_rex = new RegExp(/\n+/gm);
  var non_alpha_rex = new RegExp(/[^a-z]+/gim);
  var non_numel_rex = new RegExp(/[^0-9]+/gm);
  var non_symbol_rex = new RegExp(/[a-z0-9 \t\n]+/gim);

  $.post(
    'document.php',
    { command: [ 'choose_text', path, size, offset ] },
    function (text) {
      assignment = text;
      var texts = text.split('\n');
      $text_area.texts = [];
      $text_area.children('span').remove();
      for (var i = 0; i < texts.length; i++) {
        var $span = $('<span>').html(texts[i] + '<br>');
        $text_area.texts.push($span);
        $text_area.append($span);
      }
      $text_area.texts[0].attr('class', 'focus');

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

// {{{ 時間経過

function arc_percent(start, end, radius, width, style) {
  var g = g_context;

  g.beginPath();
  g.strokeStyle = style;
  g.lineWidth = width;
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

var timer_started = false;
var ID_rex = new RegExp('^[0-9]{2}[BMD][0-9_]{5}$', 'i');

function start_timer(deadline) {
  if (competition_mode) {
    if ($your_ID.val() == '') {
      alert('まずは，右上の空欄にあなたのログイン名を記入して下さい．');
      return false;
    }
    if (!$your_ID.val().match(ID_rex)) {
      alert('正しいログイン名を記入して下さい．');
      return false;
    }

    localStorage.cl_typing_your_ID = $your_ID.val();
    if (debug) alert('$your_ID: ' + $your_ID.val() + ', localStorage: ' + localStorage.cl_typing_your_ID);
  }

  if (timer_started) return;
  timer_started = true;

  var deadline_ms = deadline * 1000;
  var info = time_pass_visual_information;
  info.r = Math.min(frame.w, frame.h) / 2 - 30;

  var start_ms = new Date().getTime();
  last_keyup_ms = start_ms;
  var wait_ms = 1000;

  function timer(timeout) {
    var passed_ms = new Date().getTime() - start_ms;
    arc_time_passed(passed_ms / deadline_ms);

    if (passed_ms < deadline_ms) setTimeout(timer, wait_ms);
    else {
      timer_started = false;
      grade((last_keyup_ms - start_ms) / deadline_ms);
      return;
    }
  }

  timer(wait_ms);
};

// }}}

// {{{ キー入力

$(function () {
    $input_area =
      $('<textarea>').attr({ cols: 80, rows: 10 })
    .bind('keyup', input_onkeyup);
    $('<div>').append($input_area).appendTo($contents)
    $input_area.bind('paste', punish);
    $input_area.bind('contextmenu', punish);
    $input_area.bind('click', function () {
        start_timer(status_info.seconds_to_go);
      });
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

var cur_line = 0;
var last_keyup_ms = 0;

function set_focus_on_line(l, focus) {
  var $line = $text_area.texts[l];
  if ($line) $line.attr('class', focus);
};

function input_onkeyup(e) {
  last_keyup_ms = new Date().getTime();
  var c = e.keyCode;
  if (c == 8 || c == 13 || 37 <= c && c <= 40) {
    var last_line = cur_line;
    var cur_pos = $input_area[0].selectionStart;
    var input = $input_area.val();
    var n_lines = lines_upto(input, input.length);
    cur_line = lines_upto(input, cur_pos);

    set_focus_on_line(last_line, 'unfocus');
    set_focus_on_line(cur_line,  'focus');

    if (debug) {
      $debug_area.text('Key code: ' + e.keyCode +
          ', Pos : ' + cur_pos +
          ', Lines: ' + cur_line + '/' + n_lines);
    }
  } else {
    arc_percent(0, $input_area[0].selectionStart / assignment.length,
      time_pass_visual_information.r, 1, '#00a');
  }
}

// }}}

// {{{ 採点

word_rex = {
  number: new RegExp('[0-9]+', 'gm'),
  symbol: new RegExp('[^a-zA-Z0-9\\s]+', 'gm'),
  whitespace: new RegExp('\\s', 'gm'),
  whitespaces: new RegExp('[\\s]{2,}', 'gm')
};

function prune_text(text, rule) {
    if (rule['記号を無視する']) text = text.replace(word_rex.symbol, '');
    if (rule['数字を無視する']) text = text.replace(word_rex.number, ' ');
    if (rule['文字の大小を無視する']) text = text.toLowerCase();
    if (rule['空白を無視する']) text = text.replace(word_rex.whitespaces, ' ');
    return text;
}

function percent(f) {
  return Math.floor(Math.min(f * 100, 100));
}

function grade(time_ratio) {
  var $result = $panels.result;

  if (time_ratio < 0.90)
    $result.append($('<p>')
      .text('標準時間の'
        + Math.floor(time_ratio * 100)
        + '%で入力を完了したようです．速いですね！'));

  var conv = read_control_panel();
  var texts = [ prune_text(assignment, conv), prune_text($input_area.val(), conv) ];

  $result.append($('<p>')
    .text('入力の長さは問題文の' +
        percent(texts[1].length / texts[0].length) + '%です'));

  var words = [ texts[0].split(word_rex.whitespace), texts[1].split(word_rex.whitespace) ];
  words[0] = words[0].slice(0, words[1].length);

  var wc = [ {}, {} ];
  for (var i in words) {
    words[i].forEach(function (w) {
        if (w.length > 0) wc[i][w] = (wc[i][w] || 0) + 1;
      });
  }

  var wc_diff = {};
  for (w in wc[0]) wc_diff[w] = wc[0][w];
  for (w in wc[1]) {
    var diff = (wc_diff[w] || 0) - wc[1][w];
    if (diff !== 0) wc_diff[w] = diff;
    else delete wc_diff[w];
  }

  var n_failures;
  {
    var failures = [];
    var n_failures1 = n_failures2 = 0;
    for (w in wc_diff) {
      var d = wc_diff[w];
      if (d > 0) {
        n_failures1 += d;
        failures.push('-' + w);
      } else {
        n_failures2 -= d;
        failures.push('+' + w);
      }
    }
    n_failures = Math.max(n_failures1, n_failures2);
  }

  var miss_rate = percent(n_failures / words[0].length);
  $result.append(
    $('<p>').append('<strong>').text('ミス率: ').append(miss_rate));
  $result.append(
    $('<p>').append('<strong>').text('入力ミス: ').append(failures.join(', ')));

  if (competition_mode) {
    $.post('document.php',
      { command: [
        'save_record', '' + new Date(),
        $your_ID.val().toUpperCase(), time_ratio, miss_rate ] },
      function (text) { if (debug) alert(text); });
  }
  $result.append(
    ($('<input>').attr('type', 'button').val('再挑戦')
      .click(function () {
          $result.children('p').remove();
          $result.children('input').remove();
          $input_area.val('');
          clear_canvas();
          read_text();
        })));
}

// }}}

// {{{ 結果表示

$(function () {
    $table = $('<table>').appendTo($panels.result);
    $table.append($('<thead>').append($('<th>').text('結果').attr('colspan', 2)));
});
// }}}

// {{{ リクエストハンドラー
var request_handler = [];
// }}}

// {{{ 練習モード

request_handler['?trial'] =
  function () {
    competition_mode = false;
    $panels.control.css({ display: '' });
    read_text('docs/pg1661.txt', 100, 5000);
  };
// }}}

// {{{ 本番モード

request_handler['?competition'] =
  function () {
    competition_mode = true;
    $panels.control.css({ display: 'none' });
    read_text('docs/pg1661.txt', 300, 5000);
  };

// }}}

// {{{ コントロールパネル

$(function () {
    $panels.control.css({ 'display': 'none' });
    var $checkboxes = $panels.control.$checkboxes = {};

    $table = $('<table>').appendTo($panels.control);
    $table.append($('<thead>').append($('<th>').text('判定方法の設定').attr('colspan', 2)));

    [ '空白を無視する', '記号を無視する',
    '数字を無視する', '文字の大小を無視する' ].forEach(
      function (title) {
        $checkboxes[title] = $('<input>').attr('type', 'checkbox');
        ($('<tr>')
          .append($('<td>').append($checkboxes[title]))
          .append($('<td>').append($('<strong>').text(' ' + title))))
        .appendTo($table);
      });
})

function read_control_panel() {
  var status = {};
  var $checkboxes = $panels.control.$checkboxes;
  for (title in $checkboxes) {
    status[title] = $checkboxes[title].attr('checked');
  }
  return status;
}

// }}}

// {{{ 初期化

var clear_canvas;

$(function () {
    var c =
      $('<canvas>').attr({
          width: document.width,
          height: document.height }).appendTo($body)[0];
    frame = { w: c.width, h: c.height, cx: c.width / 2, cy: c.height / 2 };

    g_context = c.getContext('2d');
    clear_canvas = function () {
      g_context.clearRect(0, 0, c.width, c.height);
    }

    if (debug) {
      $body.append($('<hr>')).append($('<p>').append($('<strong>').text('Debug mode')));
      $debug_area = $('<div>').attr('id', 'debug').appendTo($body);
    }

    var commandline = location.search.split('&');
    if (commandline.length === 0) commandline = [ '?trial' ];
    var command = request_handler[commandline[0]] || request_handler['?trial'];
    command.apply(commandline.splice(0, 1));
  });

// }}}
