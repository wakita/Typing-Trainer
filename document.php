<?php
# 京

# ini_set('display_errors' 'On');

function show_pos($fp, $message) {
    echo $message . ': ' . ftell($fp) . "¥n";
}

function skip_text($fp) {
    for ($pos = ftell($fp), $line = fgets($fp);
         preg_match('/^.*[[:print:]].*$/', $line);
         $pos = ftell($fp), $line = fgets($fp)) { }
    fseek($fp, $pos);
}

function skip_blank_lines($fp) {
    $pos = ftell($fp);
    for ($line = fgets($fp);
         preg_match('/^[[:space:]]*$/', $line);
         $pos = ftell($fp), $line = fgets($fp)) { }
    fseek($fp, $pos);
}

function open_ebook($path) {
    $fp = fopen($path, 'r') or die('File open failure: (' . $filename . ')');
    $line = '';
    while (true) {
        $pos = ftell($fp);
        $line = fgets($fp);
        if (preg_match('/.*START OF THIS PROJECT GUTENBERG/', $line))
            $doc_begin = ftell($fp);
        else if (preg_match('/.*END OF THIS PROJECT GUTENBERG/', $line)) {
            $doc_end = $pos;
            break;
        }
    }
    return array('fp' => $fp, 'begin' => $doc_begin, 'end' => $doc_end);
}

function read_document($fp, $begin, $minsize) {
    fseek($fp, $begin);
    skip_text($fp);
    skip_blank_lines($fp);

    $n_chars = 0;
    $text = array();
    for ($line = fgets($fp); $n_chars < $minsize; $line = fgets($fp)) {
        $line = preg_replace('/[\r\n]+/', '', $line);
        $n_chars += strlen(preg_replace('/[^[:print:]]/', '', $line));
        array_push($text, $line);
    }
    $text = implode("\n", $text);
    $text = str_replace("\r", '', $text);
    $text = preg_replace("/^\n\n+/", "", $text);
    $text = preg_replace("/\n\n+/", "\n\n", $text);
    return $text;
}

function choose_text_from($path, $begin, $minsize) {
    $ebook = open_ebook($path);
    $text = read_document($fp, $ebook['begin'] + $begin, $minsize);
    fclose($fp);
    return $text;
}

function choose_text($path, $minsize, $offset) {
    $ebook = open_ebook($path);
    $fp = $ebook['fp'];
    if ($offset == -1) {
        $offset = rand($ebook['begin'], $ebook['end'] - $minsize * 3);
    }
    $text = read_document($fp, $offset, $minsize);
    fclose($fp);
    return $text;
}

function save_record($date, $id, $time_ratio, $miss_rate) {
  $path = 'stats/' . $id . '.txt';
  $fp = fopen($path, 'a');
  fputs($fp, 'ID = ' . $id . "\n");
  fputs($fp, 'Date = ' . $date . "\n");
  fputs($fp, 'Time ratio = ' . $time_ratio . "\n");
  fputs($fp, 'Miss ratio = ' . $miss_rate . "\n\n");
  fclose($fp);
  return 'Successfully saved';
}

$ret = '';

if (!isset($_POST['command'])) {
    $ret = choose_text('docs/pg76.txt', 500, 5000);
} else {
    $command = $_POST['command'];
    if ($command[0] === 'choose_text') {
        $path = $command[1];
        $minsize = $command[2];
        $offset = $command[3];
        $ret = choose_text($path, $minsize, $offset);
    } else if ($command[0] === 'save_record') {
      $ret = save_record($command[1], $command[2], $command[3], $command[4]);
    } else $ret = 'Invalid command' . $command[0];
}

header('Content-type: application/json');
echo json_encode($ret);
?>
