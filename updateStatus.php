<?php
require_once "admin_gaurd.php";   // Task 6: must come first
require_once "database.php";

header("Content-Type: application/json; charset=UTF-8");

// Read the JSON sent by fetch()
$data = json_decode(file_get_contents("php://input"), true);
$order_id   = $data['order_id']   ?? null;
$new_status = $data['new_status'] ?? null;

$allowed = ["Pending", "Paid", "Preparing", "Ready", "Collected"];

if (!$order_id || !in_array($new_status, $allowed, true)) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Invalid order ID or status."]);
    exit();
}

try {
    $dbase = new Database();
    $connection = $dbase->enterConnection();

    if (!$connection) {
        throw new Exception("Database connection failed.");
    }

    $query = "UPDATE orders SET status = :status WHERE id = :id";
    $statement = $connection->prepare($query);
    $statement->bindValue(":status", $new_status, PDO::PARAM_STR);
    $statement->bindValue(":id", $order_id, PDO::PARAM_INT);
    $statement->execute();

    if ($statement->rowCount() === 0) {
        echo json_encode(["success" => false, "message" => "Order not found or status unchanged."]);
        exit();
    }

    echo json_encode(["success" => true, "message" => "Order #$order_id is now $new_status."]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
?>
