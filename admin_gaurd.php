<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Task 6: Check if $_SESSION['role'] === 'admin'
if (!isset($_SESSION["role"]) || $_SESSION["role"] !== "admin") {
    http_response_code(403);
    header("Content-Type: application/json; charset=UTF-8");
    echo json_encode([
        "status"  => "error",
        "message" => "Access denied. Admin privileges required."
    ]);
    exit;
}
