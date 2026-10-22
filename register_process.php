<?php
header("Content-Type: application/json; charset=UTF-8");

require_once "Database.php";
require_once "User.php";

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Method not allowed. Use POST."]);
    exit;
}

// Support both JSON payloads (from fetch) and standard form POST
$data = $_POST;
if (empty($data)) {
    $raw = file_get_contents("php://input");
    $decoded = json_decode($raw, true);
    if (is_array($decoded)) {
        $data = $decoded;
    }
}

$name          = trim($data["name"] ?? "");
$matric_number = trim($data["matric_number"] ?? "");
$password      = $data["password"] ?? "";

if (empty($name) || empty($matric_number) || empty($password)) {
    http_response_code(400);
    echo json_encode([
        "status"  => "error",
        "message" => "Name, Matric Number, and Password are required."
    ]);
    exit;
}

$database = new Database();
$db = $database->enterConnection();

$user = new User($db);
$result = $user->register($name, $matric_number, $password);

if ($result["success"]) {
    http_response_code(201);
    echo json_encode([
        "status"  => "success",
        "message" => $result["message"],
        "user_id" => $result["user_id"]
    ]);
} else {
    http_response_code(400);
    echo json_encode([
        "status"  => "error",
        "message" => $result["message"]
    ]);
}
