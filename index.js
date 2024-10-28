const express = require('express');
const { Pool } = require('pg');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const port = 80;

// Configure PostgreSQL connection
const pool = new Pool({
    user: 'yourUser',
    host: 'yourHost',
    database: 'yourDatabase',
    password: 'yourPassword',
    port: 5432,
    ssl: {
        rejectUnauthorized: false // Only use in development
    }
});

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: 'secret_key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Set to true if using HTTPS
}));

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// Set EJS as the template engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Ensure the products table exists
async function setupDatabase() {
    const client = await pool.connect();
    try {
        const tableCheck = await client.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'products'
            );
        `);

        if (!tableCheck.rows[0].exists) {
            console.log("Creating 'products' table...");
            await client.query(`
                CREATE TABLE products ( 
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(100) NOT NULL,
                    price NUMERIC NOT NULL,
                    image_path VARCHAR(255) NOT NULL
                );
            `);

            await client.query(`
                INSERT INTO products (name, price, image_path) VALUES
                ('Sản phẩm 1', 100000, 'img/anh1.jpg'),
                ('Sản phẩm 2', 150000, 'img/anh2.jpg'),
                ('Sản phẩm 3', 200000, 'img/anh3.jpg');
            `);
            console.log("Sample data inserted.");
        }
    } catch (error) {
        console.error("Error setting up the database:", error);
    } finally {
        client.release();
    }
}

// Run database setup on startup
setupDatabase().catch(console.error);

// Main route to display products
app.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM products');
        res.render('index', { products: result.rows });
    } catch (err) {
        console.error(err);
        res.status(500).send('Database connection error');
    }
});

// Route to add product to cart
app.post('/add-to-cart', async (req, res) => {
    const productId = req.body.productId;
    if (!req.session.cart) {
        req.session.cart = [];
    }
    req.session.cart.push(productId);
    res.redirect('/');
});

// Route to display cart with product details
app.get('/cart', async (req, res) => {
    if (!req.session.cart) {
        req.session.cart = [];
    }

    try {
        const productIds = req.session.cart;
        const placeholders = productIds.map((_, i) => `$${i + 1}`).join(', ');
        const query = `SELECT * FROM products WHERE id IN (${placeholders})`;
        const result = await pool.query(query, productIds);
        res.render('cart', { cart: result.rows });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error fetching cart details');
    }
});

// Start server
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
