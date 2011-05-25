// 京

// {{{ 変数宣言

var version_info = 'Version 0.03 (May 26, 2011)';
var debug = false;

var competition_mode = false;
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
  $status = $panels.status;
  $table = $('<table>').appendTo($status);
  $('<thead>').append($('<tr>').append($('<th>').text('情報').attr('colspan', 2))).appendTo($table);
  $tbody = $('<tbody>').appendTo($table);

  if (competition_mode) {
    $your_ID = $('<input>').attr({ 'type': 'textfield' });
    ($('<tr>')
      .append($('<td>').append($('<strong>').text('名前')))
      .append($your_ID))
    .appendTo($tbody);
  }
  if (!localStorage.cl) localStorage.cl = {};
  if (localStorage.cl.your_ID) {
    $your_ID.val(localStorage.cl.your_ID);
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
  path = path || 'docs/pg76.txt';
  size = size || 100;
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

    localStorage.cl.your_ID = $your_ID.val();
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
    else { grade((last_keyup_ms - start_ms) / deadline_ms); return }
  }

  timer(wait_ms);
};

// }}}

// {{{ キー入力

$(function () {
    $input_area =
      $('<textarea>').attr({ id: 'input', cols: 80, rows: 10 })
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
var last_keyup_ms = 0;

function input_onkeyup(e) {
  last_keyup_ms = new Date().getTime();
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

function grade(time_ratio) {
  var status = read_control_panel();

  var texts = []
  texts.push(assignment);
  texts.push($input_area.val());

  var word_counts = [ {}, {} ];
  for (var i in texts) {
    var text = texts[i];
    if (status['記号を無視する']) text = text.replace(word_rex.symbol, ' ');
    if (status['数字を無視する']) text = text.replace(word_rex.number, ' ');
    if (status['文字の大小を無視する']) text = text.toLowerCase();
    if (status['空白を無視する']) text = text.replace(word_rex.whitespaces, ' ');
    texts[i] = text;
    // if (debug) alert('' + i + ': ' + text);

    var words = text.split(word_rex.whitespace);
    var wc = word_counts[i];
    words.forEach(function (word) {
        if (word.length > 0 && wc[word]) wc[word]++;
        else wc[word] = 1;
      });
  }

  var length_ratio = texts[1].length / texts[0].length;

  var total_words = 0;
  var wc_diff = {};
  for (word in word_counts[0]) {
    wc_diff[word] = word_counts[0][word];
    total_words += word_counts[0][word];
  }
  for (word in word_counts[1])
    wc_diff[word] = (wc_diff[word] || 0) - word_counts[1][word];

  var $result = $panels.result;

  if (time_ratio < 0.90)
    $result.append($('<p>')
      .text('標準時間の'
        + Math.floor(time_ratio * 100)
        + '%で入力を完了したようです．速いですね！'));

  var words_failed_to_input = [];
  var n_failures = 0;
  for (word in wc_diff) {
    if (word.length > 0 && wc_diff[word] != 0) {
      words_failed_to_input.push(word + ' (' + wc_diff[word] + ')');
      n_failures += Math.abs(wc_diff[word]);
    }
  }
  var miss_rate = Math.floor(Math.min(n_failures / total_words, 1) * 100);

  $result.append(
    $('<p>').append('<strong>').text('スペルミス率: ')
    .append(miss_rate));

  var message = '';
  if (miss_rate == 0) {
    message += '機械のような正確さで入力されています．脱帽しました．';
  } else if (n_failures < total_words * 0.1) {
    message += 'スペルミスはほとんどありませんでした．すばらしい．';
  } else if (n_failures < total_words * 0.2) {
    message += 'タイピングスピードはよいのですが，スペルミスが目立ちます．スピードを少し抑えてみては？';
  } else if (length_ratio < 0.5) {
    message += 'タイピングスピードが足りません．がんばって．';
  } else if (n_failures < total_words * length_ratio * 0.1) {
    message += 'かなり正確にタイピングしています．あとはスピードですね．';
  } else if (n_failures < total_words * length_ratio * 0.2) {
    message += 'もう少しスペルミスが減るといいのですが．';
  } else {
    message += 'がんばって';
  }

  message += '\n';

  if (words_failed_to_input.length > 0) {
    message +=
      words_failed_to_input.reduce(function (w, s) { return w + ', ' + s; });
  }

  $result.append($('<p>').text(message));

  $.post('document.php',
    { command: [
      'save_record', '' + new Date(),
      $your_ID.val().toUpperCase(), time_ratio, miss_rate ] },
    function (text) { if (debug) alert(text); });
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
    read_text();
  };
// }}}

// {{{ 本番モード

request_handler['?competition'] =
  function () {
    competition_mode = true;
    $panels.control.css({ display: 'none' });
    read_text('docs/pg76.txt', 100, 5000);
  };

// }}}

// {{{ コントロールパネル

var control_panel = {};

$(function () {
    ($panels.control.css({ 'display': 'none' }));

    $table = $('<table>').appendTo($panels.control);
    $table.append($('<thead>').append($('<th>').text('判定方法の設定').attr('colspan', 2)));

    [ '空白を無視する', '記号を無視する',
    '数字を無視する', '文字の大小を無視する' ].forEach(
      function (title) {
        ($('<tr>')
          .append($('<td>').append($('<input>').attr('type', 'checkbox')))
          .append($('<td>').append($('<strong>').text(' ' + title))))
        .appendTo($table);
      });
})

function read_control_panel() {
  var status = {};
  // m = '';
  for (title in control_panel) {
    $checkbox = control_panel[title];
    status[title] = $checkbox.attr('checked');
  }
  return status;
}

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

    var commandline = location.search.split('&');
    if (commandline.length === 0) commandline = [ '?trial' ];
    var command = request_handler[commandline[0]] || request_handler['?trial'];
    command.apply(commandline.splice(0, 1));
  });

// }}}
