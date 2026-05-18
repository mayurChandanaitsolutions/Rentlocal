<?php
session_start();

if(isset($_POST['login'])){

$email=$_POST['email'];
$password=$_POST['password'];

if(
$email==$_SESSION['email']
&&
$password==$_SESSION['password']
){

header("Location: index.php");

}else{

echo "<script>alert('Invalid Login');</script>";

}

}
?>

<!DOCTYPE html>
<html>
<head>

<title>Login</title>

<style>

body{
margin:0;
font-family:Arial;
background:#0f172a;
display:flex;
justify-content:center;
align-items:center;
height:100vh;
}

.box{
width:350px;
background:#1e293b;
padding:40px;
border-radius:20px;
text-align:center;
}

h1{
color:white;
margin-bottom:20px;
}

input{
width:100%;
padding:12px;
margin:10px 0;
border:none;
border-radius:10px;
}

button{
width:100%;
padding:12px;
background:#6C63FF;
border:none;
border-radius:10px;
color:white;
font-size:18px;
cursor:pointer;
}

a{
color:white;
text-decoration:none;
}

</style>

</head>

<body>

<div class="box">

<h1>User Login</h1>

<form method="POST">

<input type="email" name="email" placeholder="Enter Email" required>

<input type="password" name="password" placeholder="Enter Password" required>

<button type="submit" name="login">
Login
</button>

</form>

<br>

<a href="register.php">
Create New Account
</a>

</div>

</body>
</html>