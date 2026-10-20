<?php
    class Database{
        //declearing the fields for the database connection 
        private $host= "localhost";
        private $db_name= "cafeteria_db";
        private $username= "root";
        private $password= "";

        public $connection;
        public function enterConnection(){
            $this->connection=null;
            try{
                $this->connection=new PDO("mysql:host=".$this->host.";dbname=".$this->db_name,$this->username,$this->password);

                // forcing the php data object(PDO) to throw an exception incase there is an error in the connection 
                $this->connection->setAttribute(PDO::ATTR_ERRMODE,PDO::ERRMODE_EXCEPTION);
                // return clean associative arrays when fetching rows
                $this->connection->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
            }
            catch(PDOException $exception){
                echo "Connection Error: ".$exception->getMessage();
            }
            return $this->connection;
        }
    }
?>
