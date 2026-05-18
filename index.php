<!DOCTYPE html>
<html>
<head>

<title>RentLocally</title>

<style>

body{
margin:0;
font-family:Arial;
background:#0f172a;
color:white;
}

.navbar{
background:#111827;
padding:20px;
text-align:center;
font-size:30px;
font-weight:bold;
color:#6C63FF;
}

.hero{
padding:60px;
text-align:center;
background:linear-gradient(to right,#6C63FF,#9333EA);
}

.hero h1{
font-size:50px;
}

.products{
display:flex;
justify-content:center;
gap:20px;
flex-wrap:wrap;
padding:50px;
}

.card{
width:250px;
background:#1e293b;
padding:25px;
border-radius:20px;
text-align:center;
}

.card h2{
color:#6C63FF;
}

.price{
font-size:28px;
margin:20px 0;
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

<div class="navbar">
RentLocally
</div>

<div class="hero">

<h1>Rent Premium Products Easily</h1>

<p>Camera • Laptop • Bike • Furniture</p>

</div>

<div class="products">

<div class="card">

<h2>📷 DSLR Camera</h2>

<p>Professional HD Camera</p>

<div class="price">
₹500/day
</div>

<a href="payment.php?product=DSLR Camera&amount=500">

<button>
Rent Now
</button>

</a>

</div>

<div class="card">

<h2>💻 Gaming Laptop</h2>

<p>High Performance Laptop</p>

<div class="price">
₹1200/day
</div>

<a href="payment.php?product=Gaming Laptop&amount=1200">

<button>
Rent Now
</button>

</a>

</div>

<div class="card">

<h2>🏍 Sports Bike</h2>

<p>Fast & Stylish Bike</p>

<div class="price">
₹800/day
</div>

<a href="payment.php?product=Sports Bike&amount=800">

<button>
Rent Now
</button>

</a>

</div>

<div class="card">

<h2>🛋 Furniture</h2>

<p>Luxury Home Furniture</p>

<div class="price">
₹700/day
</div>

<a href="payment.php?product=Furniture&amount=700">

<button>
Rent Now
</button>

</a>

</div>

</div>

</body>
</html>