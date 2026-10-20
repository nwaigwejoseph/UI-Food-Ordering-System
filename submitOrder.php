<?php
    header("Content-Type: application/json; charset=UTF-8");
    require_once"database.php";
    require_once"order.php";
    session_start();

    //Verifying session to ensure the user is logged in before they can submit an order
    if (!isset($_SESSION['user_id'])){
        echo json_encode([
            "success"=>false,
            "message"=>"Unauthorized access.\nPlease log in first to submit an order."

        ]);
        exit();
    }
    $user_id=$_SESSION['user_id'];
    // Reading the data from the frontend in a json format
    $input=file_get_contents("php://input");// this collects the file that was sent from the frontend in a json format and stores it in a variable
    $data=json_decode($input,true);// this decodes the json data into an associative array

    if (!isset($data['items'])|| !is_array($data['items'])|| empty($data['items'])){
        echo json_encode([
            "success"=>false,
            "message"=>"Your cart is empty or the items are not in the correct format."
        ]);
        exit();
    }
    try{
        $dbase=new Database();
        $connection = $dbase->enterConnection();
        $dbase->beginTransaction();// this makes sure that all communication in the database is not autocommited until a commit is done  starting a transaction to ensure that all the queries are executed successfully before committing them to the database
        $order =new order(connection);
        $order_id=$order->createOrder($user_id);

        if (!$order_id){
            throw new Exception("Failed to create main order.");
        }
        // Looping through the items in the order and inserting them into the orders_items table
        foreach($data['items'] as $item){
            $soupId=!empty($item['soup_id']) ? $item['soup_id']: null;
            $savedOrder=$order->addOrderItems($order_id,$item['meal_id'],$soupId,$item['quantity'],$item['unit_price']);
        }
        if (!$savedOrder){
            throw new Exception("Failed to insert item ID: ".$item['meal_id']);
        }
    
    //commiting the transaction to the database
    $dbase->commit();
    echo json_encode([
        "success"=>true,
        "message"=>"Order submitted successfully.",
        "order_id"=>$order_id
    ]);
    }
    catch(Exception $e){
        if (isSet($dbase)&& $dbase->inTransaction()){
        $dbase->rollBack();// rolling back the transaction in case of an error
        echo json_encode([
            "success"=>false,
            "message"=>$e->getMessage()
        ]);}
    }

?>
