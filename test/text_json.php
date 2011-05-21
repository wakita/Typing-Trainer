<?php
$n = $_POST['n'];

header('Content-type: application/json');
echo json_encode(array('n' => $n + 1));
?>
