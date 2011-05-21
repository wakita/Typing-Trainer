var span_n;

$(function () { span_n = $('#n'); });

var increment = function () {
  n = $('#n').text();
  $.post(
    'text_json.php',
    { n: n },
    function (data) { span_n.text(data.n); },
    'json');
};
