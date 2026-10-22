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

$matric_number = trim($data["matric_number"] ?? "");
$password      = $data["password"] ?? "";

if (empty($matric_number) || empty($password)) {
    http_response_code(400);
    echo json_encode([
        "status"  => "error",
        "message" => "Matric Number and Password are required."
    ]);
    exit;
}

$database = new Database();
$db = $database->enterConnection();

$user = new User($db);
$result = $user->login($matric_number, $password);

if ($result["success"]) {
    // Task 5: Start session and store $_SESSION['user_id'] and $_SESSION['role']
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }

    $_SESSION["user_id"] = $result["user"]["id"];
    $_SESSION["role"]    = $result["user"]["role"];
    $_SESSION["name"]    = $result["user"]["name"];

    http_response_code(200);
    echo json_encode([
        "status"  => "success",
        "message" => $result["message"],
        "user"    => $result["user"]
    ]);
} else {
    http_response_code(401);
    echo json_encode([
        "status"  => "error",
        "message" => $result["message"]
    ]);
}
