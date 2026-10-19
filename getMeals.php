<?php
    header("Content-Type: application/json; charset=UTF-8");
    require_once"database.php";
    require_once"Meal.php";
    try{
        $database=new Database();
        $dbase=$database->enterConnection();
        $meal=new Meal($dbase);
        $meals=$meal->getmeals();

        //converting the meals array to a json format
        echo json_encode([
            "Success"=>true,
            "meals"=>$meals
        ]);
    }
    catch(Exception $e){
        echo json_encode([
            "Success"=>false,
            "message"=>$e->getMessage()
        ]);
    }
  


    
?>
