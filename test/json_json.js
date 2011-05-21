var span_n = [];

$(function () {
    span_n.push($('#n1'));
    span_n.push($('#n2'));
  });

var increment = function () {
  n = $('#n').text();
  $.post(
    'json_json.php',
    { data: [ span_n[0].text(), span_n[1].text() ] },
    function (data) {
      span_n[0].text(data[0]);
      span_n[1].text(data[1]);
    },
    'json');
};
