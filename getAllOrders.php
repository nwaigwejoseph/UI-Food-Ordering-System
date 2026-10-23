<?php
require_once "admin_gaurd.php";   // Task 6: must come first, blocks non-admins
require_once "database.php";

header("Content-Type: application/json; charset=UTF-8");

try {
    $dbase = new Database();
    $connection = $dbase->enterConnection();

    if (!$connection) {
        throw new Exception("Database connection failed.");
    }

    $query = "SELECT o.*,
                     u.name AS student_name,
                     oi.meal_id, oi.soup_id, oi.quantity, oi.unit_price,
                     m.name AS meal_name
              FROM orders o
              JOIN users u              ON o.user_id = u.id
              LEFT JOIN orders_items oi ON oi.order_id = o.id
              LEFT JOIN meals m         ON oi.meal_id = m.id
              ORDER BY o.id DESC";

    $statement = $connection->prepare($query);
    $statement->execute();
    $rows = $statement->fetchAll(PDO::FETCH_ASSOC);

    // The join returns one row per item, so group the rows into one entry per order
    $orders = [];
    foreach ($rows as $row) {
        $id = $row['id'];

        if (!isset($orders[$id])) {
            $orders[$id] = [
                "order_id"     => $id,
                "student_name" => $row['student_name'],
                "status"       => $row['status'],
                "total_amount" => 0,
                "items"        => []
            ];
        }

        if ($row['meal_id'] !== null) {
            $orders[$id]['items'][] = [
                "meal_id"    => $row['meal_id'],
                "meal_name"  => $row['meal_name'],
                "soup_id"    => $row['soup_id'],
                "quantity"   => $row['quantity'],
                "unit_price" => $row['unit_price']
            ];
            // createOrder() doesn't save a total yet, so calculate it here
            $orders[$id]['total_amount'] += $row['quantity'] * $row['unit_price'];
        }
    }

    echo json_encode([
        "success" => true,
        "orders"  => array_values($orders)
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
?>
