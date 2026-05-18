<?php

$payment_id=$_GET['payment_id'];

$product=$_GET['product'];

$amount=$_GET['amount'];

?>

<!DOCTYPE html>
<html>
<head>

<title>Success</title>

<style>

body{
margin:0;
font-family:Arial;
background:#0f172a;
display:flex;
justify-content:center;
align-items:center;
height:100vh;
color:white;
}

.box{
width:400px;
background:#1e293b;
padding:40px;
border-radius:20px;
text-align:center;
}

button{
padding:12px 20px;
background:#6C63FF;
border:none;
border-radius:10px;
color:white;
font-size:18px;
cursor:pointer;
}

</style>

</head>

<body>

<div class="box">

<h1>Payment Successful 🎉</h1>

<p>Product: <?php echo $product; ?></p>

<p>Amount: ₹<?php echo $amount; ?></p>

<p>Payment ID: <?php echo $payment_id; ?></p>

<a href="index.php">

<button>
Back Home
</button>

</a>

</div>

</body>
</html>