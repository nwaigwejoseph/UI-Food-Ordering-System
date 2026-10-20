<?php
    class Meal {
        private $connect;

        public function __construct($db){
            $this->connect=$db;
        }

        public function getmeals(){
            $request="SELECT id,name,category,price,stock FROM meals WHERE is_available=1";
            $statement=$this->connect->prepare($request);// preparing the query to be executed 
            $statement->execute();// executing the query
            //returning the result of the query in an array format which would then be converted to a json format to the person who requested for it.
            return $statement->fetchAll();
        }
    }
?>
