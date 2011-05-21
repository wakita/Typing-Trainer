var span_n;

$(function () { span_n = $('#n'); });

var increment = function () {
  n = $('#n').text();
  $.post(
    'text_text.php',
    { n: n },
    function (_n) { span_n.text(_n); });
};
