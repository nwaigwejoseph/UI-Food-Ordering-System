<?php
declare(strict_types=1);

class User {
    private PDO $db;
    private string $table = 'users';

    // Dependency Injection: Pass the PDO connection into the User class when creating it
    public function __construct(PDO $db) {
        $this->db = $db;
    }

    /**
     * Task 4 Logic: Register a new student
     */
    public function register(string $name, string $matricNumber, string $password): array {
        // 1. Check if this Matric Number is already registered
        $checkSql = "SELECT id FROM {$this->table} WHERE matric_number = :matric_number LIMIT 1";
        $checkStmt = $this->db->prepare($checkSql);
        $checkStmt->execute(['matric_number' => $matricNumber]);

        if ($checkStmt->fetch()) {
            return [
                'success' => false,
                'status'  => 409, // 409 Conflict
                'message' => 'A user with this Matric Number is already registered.'
            ];
        }

        // 2. Scramble the password using PHP's built-in bcrypt algorithm (Task 4 requirement)
        $hashedPassword = password_hash($password, PASSWORD_DEFAULT);

        // 3. Insert the new user with the default role of 'student' (Task 4 requirement)
        $insertSql = "INSERT INTO {$this->table} (name, matric_number, password, role) 
                      VALUES (:name, :matric_number, :password, :role)";
        
        $insertStmt = $this->db->prepare($insertSql);
        $insertStmt->execute([
            'name'          => $name,
            'matric_number' => $matricNumber,
            'password'      => $hashedPassword,
            'role'          => 'student'
        ]);

        return [
            'success' => true,
            'status'  => 201, // 201 Created
            'message' => 'Registration successful! You can now log in.',
            'user_id' => (int) $this->db->lastInsertId()
        ];
    }

    /**
     * Task 5 Logic: Verify Matric Number & Password
     */
    public function login(string $matricNumber, string $password): array {
        // 1. Search the database for the submitted matric_number (Task 5 requirement)
        $sql = "SELECT id, name, matric_number, password, role 
                FROM {$this->table} 
                WHERE matric_number = :matric_number 
                LIMIT 1";
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute(['matric_number' => $matricNumber]);
        $user = $stmt->fetch();

        // 2. Use password_verify() to check the submitted password against the hash (Task 5 requirement)
        if (!$user || !password_verify($password, $user['password'])) {
            return [
                'success' => false,
                'status'  => 401, // 401 Unauthorized
                'message' => 'Invalid Matric Number or password.'
            ];
        }

        // 3. Return the user details (without the password hash!) so login_process.php can set the session
        return [
            'success' => true,
            'status'  => 200,
            'message' => 'Login successful!',
            'user'    => [
                'id'            => (int) $user['id'],
                'name'          => $user['name'],
                'matric_number' => $user['matric_number'],
                'role'          => $user['role']
            ]
        ];
    }
}
