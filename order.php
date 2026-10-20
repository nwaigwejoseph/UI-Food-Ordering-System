<?php
    class order{
        private $connection;
        public function __construct($dbase){
            $this->connection=$dbase;
        }

        public function createOrder($user){
            $query="INSERT INTO orders(user_id,status) VALUES(:user_id,:'Pending')";
            $statement=$this->connection->prepare($query);
            $statement->bindParam(":user_id",$user,PDO::PARAM_INT);
            
            if ($statement->execute()){
                return $this->connection->lastInsertId();
            }
            return false;

        }


        public function addOrderItems($orderid,$meal_id,$soup_id,$quantity,$unitPrice){
            $query="INSERT INTO orders_items(order_id,meal_id,soup_id,quantity,unit_price) VALUES(:order_id,:meal_id,:soup_id,:quantity,:unit_price)";
            $statement=$this->connection->prepare($query);

            // binding the parameters so the database treats them as plain text not commands that would be executed 
            $statement->bindParam(":order_id",$orderid,PDO::PARAM_INT);
            $statement->bindParam("meal_id",$meal_id,PDO::PARAM_INT);
            if (empty($soup_id)){
                $statement->bindParam(":soup_id",null,PDO::PARAM_NULL);
            }
            else{
                $statement->bindParam(":soup_id",$soup_id,PDO::PARAM_INT);
            }
            $statement->bindParam(":quantity",$quantity,PDO::PARAM_INT);
            $statement->bindParam(":unit_price",$unitPrice,PDO::PARAM_INT);
            return $statement->execute();

        }
    }
