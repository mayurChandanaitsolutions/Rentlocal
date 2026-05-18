<?php

$product=$_GET['product'];

$amount=$_GET['amount'];

?>

<!DOCTYPE html>
<html>
<head>

<title>Payment</title>

<script src="https://checkout.razorpay.com/v1/checkout.js"></script>

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

h1{
color:#6C63FF;
}

button{
padding:15px 30px;
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

<h1>Razorpay Payment</h1>

<h2><?php echo $product; ?></h2>

<h3>Amount: ₹<?php echo $amount; ?></h3>

<button id="pay-btn">
Pay Now
</button>

</div>

<script>

var options = {

"key":"rzp_test_SMl2zPKTGnAKzE","secret":"v6nt7Fpo16MQEmQjFPlDUk3x",

"amount":"<?php echo $amount*100; ?>",

"currency":"INR",

"name":"RentLocally",

"description":"Rental Payment",

"handler": function (response){

window.location.href=
"success.php?payment_id="+response.razorpay_payment_id+
"&product=<?php echo $product; ?>"+
"&amount=<?php echo $amount; ?>";

},

"theme":{
"color":"#6C63FF"
}

};

var rzp1 = new Razorpay(options);

document.getElementById('pay-btn').onclick=function(e){

rzp1.open();

e.preventDefault();

}

</script>

</body>
</html>