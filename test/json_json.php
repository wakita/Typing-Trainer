<?php
$data = $_POST['data'];

header('Content-type: application/json');
echo json_encode(array($data[0] + 1, $data[1] + 2));
?>
