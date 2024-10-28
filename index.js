const express = require('express');
const { Pool } = require('pg');
const session = require('express-session');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

// Configure PostgreSQL connection
const pool = new Pool({
    user: 'nhattan123',
    host: 'localhost',
    database: 'nhattan123',
    password: 'nhattan123',
    port: 5432,
});

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: 'secret_key',
    resave: false,
    saveUninitialized: true,
}));

// Serve static files from the "public" directory
app.use(express.static('public'));

// Set EJS as the template engine
app.set('view engine', 'ejs');

// Main route to display products
app.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM products');
        res.render('index', { products: result.rows });
    } catch (err) {
        console.error(err);
        res.status(500).send('Lỗi kết nối cơ sở dữ liệu');
    }
});

// Route to add product to cart
app.post('/add-to-cart', (req, res) => {
    const productId = req.body.productId;
    if (!req.session.cart) {
        req.session.cart = [];
    }
    req.session.cart.push(productId);
    res.redirect('/');
});

// Route to display cart
app.get('/cart', (req, res) => {
    if (!req.session.cart) {
        req.session.cart = [];
    }
    res.render('cart', { cart: req.session.cart });
});

// Start server
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
