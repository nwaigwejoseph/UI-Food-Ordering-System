<?php
class User {
    private $conn;
    private $table = "users";

    // Constructor receives the PDO connection from $database->enterConnection()
    public function __construct($db) {
        $this->conn = $db;
    }

    // Task 4: Register a new student
    public function register($name, $matric_number, $password) {
        // 1. Check if matric_number already exists in the users table
        $checkQuery = "SELECT id FROM " . $this->table . " WHERE matric_number = :matric_number LIMIT 1";
        $checkStmt = $this->conn->prepare($checkQuery);
        $checkStmt->execute([
            ':matric_number' => $matric_number
        ]);

        if ($checkStmt->fetch(PDO::FETCH_ASSOC)) {
            return [
                'success' => false,
                'message' => 'This Matric Number is already registered.'
            ];
        }

        // 2. Scramble the password using password_hash() (Task 4 requirement)
        $hashed_password = password_hash($password, PASSWORD_DEFAULT);

        // 3. Save user to the users table with default role of 'student' (Task 4 requirement)
        $query = "INSERT INTO " . $this->table . " (name, matric_number, password, role) 
                  VALUES (:name, :matric_number, :password, :role)";

        $stmt = $this->conn->prepare($query);
        $saved = $stmt->execute([
            ':name'          => $name,
            ':matric_number' => $matric_number,
            ':password'      => $hashed_password,
            ':role'          => 'student'
        ]);

       if ($saved) {
            return [
                'success' => true,
                'message' => 'Registration successful!',
                'user_id' => $this->conn->lastInsertId()
            ];
        }
        
        return [
            'success' => false,
            'message' => 'Failed to register user.'
        ];
    }

    // Task 5: Verify login credentials
    public function login($matric_number, $password) {
        // 1. Search the database for the submitted matric_number (Task 5 requirement)
        $query = "SELECT id, name, matric_number, password, role 
                  FROM " . $this->table . " 
                  WHERE matric_number = :matric_number 
                  LIMIT 1";

        $stmt = $this->conn->prepare($query);
        $stmt->execute([
            ':matric_number' => $matric_number
        ]);

        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        // 2. Use password_verify() to check the password (Task 5 requirement)
        if ($user && password_verify($password, $user['password'])) {
            // Remove the password hash before returning user data
            unset($user['password']);

            return [
                'success' => true,
                'message' => 'Login successful!',
                'user'    => $user
            ];
        }

        return [
            'success' => false,
            'message' => 'Invalid Matric Number or Password.'
        ];
    }
}
