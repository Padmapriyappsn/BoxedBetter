const HTTP_PORT = process.env.PORT || 8080;
const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const restaurantData = require("./modules/restaurantData");
const exphbs = require('express-handlebars');
const bcrypt = require('bcryptjs');  // For hashing the password

const app = express();
const session = require('express-session');

const { Student, Restaurant, Order, Food } = require('./modules/restaurantData');  // Path to restrauntData.js
const { getRestaurants, getFoodByRestaurantId, addFoodItem , deleteFoodItem} = require('./modules/restaurantData');  // Path to restrauntData.js

// Configure express-handlebars
app.engine('.hbs', exphbs.engine({
    extname: '.hbs',
    defaultLayout: 'main',
    helpers: {
        navLink: function(url, options) {
            return '<li' + 
                ((url === app.locals.activeRoute) ? ' class="nav-item active" ' : ' class="nav-item" ') + 
                '><a class="nav-link" href="' + url + '">' + options.fn(this) + '</a></li>';
        },
        equal: function(lvalue, rvalue, options) {
            if (arguments.length < 3)
                throw new Error("Handlebars Helper equal needs 2 parameters");
            if (lvalue != rvalue) {
                return options.inverse(this);
            } else {
                return options.fn(this);
            }
        }
    }
}));

app.set('views', __dirname + '/views');
app.set('view engine', '.hbs');

// Configure body-parser middleware to parse URL-encoded bodies
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.urlencoded({ extended: true }));

// Middleware to set the active route for navigation highlighting
app.use(function(req, res, next) {
    let route = req.path.substring(1);
    app.locals.activeRoute = "/" + (isNaN(route.split('/')[1]) ? route.replace(/\/(?!.*)/, "") : route.replace(/\/(.*)/, ""));
    next();
});

// Middleware routes to serve static files
app.use(express.static(path.join(__dirname, 'views'))); // Serve static files from the 'views' folder
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files from the 'public' folder
app.use(express.static(path.join(__dirname, 'modules'))); // Serve static files from the 'modules' folder

// Configure session middleware
app.use(session({
    secret: 'your-secret-key', // Replace with a strong, random secret
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: false, // Set to true in production with HTTPS
        maxAge: 1000 * 60 * 60 * 24 // 1 day (adjust as needed)
    }
}));

// Logout Route for Restaurant
app.get('/restaurant/logout', (req, res) => {
    console.log("Logout route hit!"); // Verify route execution
    //res.redirect('/login');
    req.session.destroy((err) => {
        if (err) {
            console.error("Logout error:", err); // Log potential errors
            return res.status(500).send("Error during logout");
        }
        console.log("Session destroyed!"); // Confirm session destruction
        console.log("Redirecting to /login"); // Verify redirect
        res.redirect('/login');
    });
});

// Logout Route for Student
app.get('/student/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).send("Error during logout");
        }
        // Redirect to login page after session is destroyed
        res.redirect('/login');
    });
});

// GET /students route
app.get("/students", (req, res) => {
    restaurantData.getAllStudents()
        .then(data => {
            if (data.length > 0) {
                res.render("students", { students: data });
            } else {
                res.render("students", { message: "No students found" });
            }
        })
        .catch(() => res.render("students", { message: "No students found" }));
});

// GET /restaurants route
app.get("/restaurants", (req, res) => {
    restaurantData.getRestaurants()
        .then(data => {
            if (data.length > 0) {
                res.render("restaurants", { restaurants: data });
            } else {
                res.render("restaurants", { message: "No restaurants found" });
            }
        })
        .catch(() => res.render("restaurants", { message: "No restaurants found" }));
});

// GET /student/:studentId route
app.get("/student/:studentId", (req, res) => { 
    let viewData = {}; 
    restaurantData.getStudentById(req.params.studentId)
        .then((data) => { 
            viewData.student = data || null; 
        })
        .catch(() => { 
            viewData.student = null;
        })
        .then(restaurantData.getRestaurants)
        .then((data) => { 
            viewData.restaurants = data; 
        })
        .catch(() => { 
            viewData.restaurants = [];
        })
        .then(() => { 
            if (!viewData.student) { 
                res.status(404).send("student Not Found"); 
            } else { 
                res.render("student", { viewData: viewData }); 
            } 
        }); 
});

// GET /restaurant/:id route
app.get("/restaurant/:id", (req, res) => {
    restaurantData.getRestaurantById(parseInt(req.params.id))
        .then(data => {
            if (data) {
                res.render("restaurant", { restaurant: data });
            } else {
                res.status(404).send("Restaurant Not Found");
            }
        })
        .catch(() => {
            res.render("restaurant", { message: "No results for restaurant" });
        });
});

// GET /student/delete/:studentId route
app.get("/student/delete/:studentId", (req, res) => {
    restaurantData.deleteStudentById(parseInt(req.params.studentId, 10))
        .then(() => {
            res.redirect('/students');
        })
        .catch(() => {
            res.status(500).send("Unable to remove student / student not found");
        });
});

// GET /restaurant/delete/:id route
app.get("/restaurant/delete/:id", (req, res) => {
    restaurantData.deleteRestaurantById(parseInt(req.params.id, 10))
        .then(() => {
            res.redirect('/restaurants');
        })
        .catch(() => {
            res.status(500).send("Unable to remove restaurant / Restaurant not found");
        });
});

// GET / route
app.get("/", (req, res) => {
    res.render('home');
});

// GET /about route
app.get("/about", (req, res) => {
    res.render('about');
});

// GET /aboutfoodwaste route
app.get("/aboutfoodwaste", (req, res) => {
    res.render('aboutfoodwaste');
});

// GET /students/add route
app.get("/students/add", (req, res) => {
    restaurantData.getRestaurants()
        .then(data => {
            res.render("addStudent", { restaurants: data });
        })
        .catch(() => {
            res.render("addStudent", { restaurants: [] });
        });
});

// GET /restaurants/add route
app.get("/restaurants/add", (req, res) => {
    res.render("addRestaurant"); // Ensure 'addRestaurant.hbs' exists in the 'views' directory
});

// Route to render login page
app.get('/login', (req, res) => {
    res.render('login');
});


// POST request for login
app.post('/login', (req, res) => {
    const { email, password, role } = req.body;

    // Check if the role is selected as student or restaurant
    if (role === 'student') {
        // Student login logic
        Student.findOne({ where: { email } })
            .then(student => {
                if (!student) {
                    console.log("Student not found in DB");  // Debugging line
                    return res.status(400).send('Invalid credentials');
                }
                bcrypt.hash("1234", 10, (err, hash) => {
                    console.log("New hashed password:", hash);
                });                
                console.log("Stored password:", student.password);
                console.log("Entered password:", password);             
                if (student) {
                    /*bcrypt.compare(string, student.password, (err, isMatch) => {
                        if (err) return res.status(500).send('Error checking password');
                        
                        if (isMatch) {
                            // Store student in session
                            req.session.student = student;
                            return res.redirect('/student-dashboard');
                        } else {
                            return res.status(400).send('Invalid credentials');
                        }
                    });*/
                    if (password === student.password) {
                        req.session.student = student;
                        return res.redirect('/student-dashboard');
                    } else {
                        return res.status(400).send('Invalid credentials');
                    }                    
                } else {
                    return res.status(400).send('Invalid credentials');
                }
            })
            .catch(err => res.status(500).send('Error logging in'));
    } else if (role === 'restaurant') {
        // Restaurant login logic
        Restaurant.findOne({ where: { email } })
            .then(restaurant => {
                if (restaurant) {
                    // Restaurant is authenticated, store in session
                    req.session.restaurant = restaurant;
                    //req.session.restaurantId = restaurant.id;  // Store restaurantId in session
                    return res.redirect('/restaurant-dashboard');
                } else {
                    return res.status(400).send('Invalid credentials');
                }
            })
            .catch(err => res.status(500).send('Error logging in'));
    } else {
        return res.status(400).send('Invalid role selected');
    }
});


//display student dashboard with food items to place order
app.get('/student-dashboard', (req, res) => {
    if (!req.session.student) {
        return res.redirect('/login');  // If not logged in, redirect to login
    }

    // Fetch available restaurants with discounted food
    getRestaurants()
        .then(restaurants => {
            res.render('student-dashboard', { 
                student: req.session.student,
                restaurants: restaurants
            });
        })
        .catch(err => res.status(500).send('Error fetching restaurants'));
});

app.get('/restaurant-dashboard', async (req, res) => {
    if (!req.session.restaurant) {
        return res.redirect('/login');
    }
    const restaurantId = req.session.restaurant.restaurantId;

    try {
        const foods = await Food.findAll({ where: { restaurantId } }); // Or getFoodByRestaurantId(restaurantId);

        if (foods.length === 0) {
            return res.redirect('/post-new-item'); // Redirect if no foods found
        }

        res.render('restaurant-dashboard', { restaurant: req.session.restaurant, restaurantId: restaurantId, foods: foods });
    } catch (error) {
        console.error("Error fetching foods", error);
        res.status(500).send("Internal Server Error");
    }
});
app.post('/restaurant-dashboard', (req, res) => {
    if (!req.session.restaurant) {
        return res.redirect('/login');
    }

    const { foodName, description, discountedPrice } = req.body;

    const foodData = {
        restaurantId: req.session.restaurant.restaurantId,
        foodName,
        description,
        discountedPrice
    };

    addFoodItem(foodData)
        .then(() => res.redirect('/restaurant-dashboard'))
        .catch(err => {
            console.error("Error adding food item:", err);
            res.status(500).send('Error adding food item: ' + err.message); // or render the error
        });
});
//view orders placed by student in this restraunt
app.get('/restaurant/orders', async (req, res) => {
    if (!req.session.restaurant) {
        return res.redirect('/login');
    }
    const restaurantId = req.session.restaurant.restaurantId;
    try {
        // Assuming you have a function or model to fetch orders
        const orders = await getOrdersByRestaurantId(restaurantId);
        res.render('restaurant-orders', { orders: orders });
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).send('Internal Server Error');
    }
});

// route to delete food item in restraunt
app.post('/restaurant/delete-food/:foodId', async (req, res) => {
    const { foodId } = req.params;
    console.log("Delete route hit for foodId:", foodId); // Debugging line
    try {
        await restaurantData.deleteFoodItem(foodId); // Call the deleteFoodItem function from restaurantData
        res.redirect('/restaurant-dashboard');
    } catch (err) {
        console.error('Error deleting food item:', err);
        res.redirect('/restaurant-dashboard?error=' + encodeURIComponent(err.message));
    }
});

// Route to render place order page
app.get('/placeorder', (req, res) => {
    if (req.session.user && req.session.user.role === 'student') {
        restaurantData.getFoodItems().then((foodItems) => {
            res.render('placeorder', { isStudent: true, foodItems });
        });
    } else {
        res.render('placeorder', { isStudent: false });
    }
});

// Route to handle placing an order
app.post('/order', async (req, res) => {
    const { foodItem } = req.body;
    const order = await restaurantData.placeOrder(req.session.user.id, foodItem);
    res.redirect('/trackorderstatus');
});

// Route to render track order status page
app.get('/trackorderstatus', async (req, res) => {
    const orders = await restaurantData.getOrders(req.session.user.id);
    res.render('trackorderstatus', { orders });
});

// Route to render pickup orders page (for restaurant staff)
app.get('/pickuporder', async (req, res) => {
    const readyOrders = await restaurantData.getReadyOrders();
    res.render('pickuporder', { readyOrders });
});

// GET /student/orders route - to display the student's orders
app.get('/student/orders', (req, res) => {
    if (!req.session.student) {
        return res.redirect('/login');  // If not logged in, redirect to login
    }
    const studentId = req.session.student.studentId;

    // Assuming you have a method to fetch the orders for a student
    Order.findAll({
        where: { studentId: req.session.student.studentId }
    })
    .then(orders => {
        if (orders.length > 0) {
            res.render('student-orders', { orders: orders });
        } else {
            res.render('student-orders', { message: "No orders found" });
        }
    })
    .catch(err => {
        console.error('Error fetching orders:', err);
        res.status(500).send('Error fetching orders');
    });
});
// POST /student/orders route - to place an order
app.post('/student/orders', (req, res) => {
    if (!req.session.student) {
        return res.redirect('/login');  // If not logged in, redirect to login
    }

    // Extract order details from the request body
    const { foodItemId, quantity } = req.body;
    
    if (!foodItemId || !quantity || quantity <= 0) {
        return res.status(400).send("Invalid food item or quantity");
    }

    // Fetch the food item details from the database
    Food.findByPk(foodItemId)
        .then(foodItem => {
            if (!foodItem) {
                return res.status(404).send("Food item not found");
            }

            // Calculate the total price (assuming the food item has a `discountedPrice` field)
            const totalPrice = foodItem.discountedPrice * quantity;

            // Create a new order in the database
            Order.create({
                studentId: req.session.student.studentId,
                foodItemId: foodItem.id,
                quantity: quantity,
                totalPrice: totalPrice,
                status: 'Pending' // Initial order status
            })
            .then(() => {
                res.redirect('/student/orders'); // Redirect to the orders page after successful order
            })
            .catch(err => {
                console.error('Error placing order:', err);
                res.status(500).send('Error placing order');
            });
        })
        .catch(err => {
            console.error('Error fetching food item:', err);
            res.status(500).send('Error processing order');
        });
});


// POST /students/add route
app.post('/students/add', (req, res) => {
    restaurantData.addStudent(req.body)
        .then(() => {
            res.redirect('/login');
        })
        .catch(() => {
            res.status(500).send('Error adding student');
        });
});

// POST /restaurants/add route
app.post("/restaurants/add", (req, res) => {
    restaurantData.addRestaurant(req.body)
        .then(() => {
            res.redirect('/login');
        })
        .catch((err) => {
            console.error("Error adding restaurant:", err); // Debugging line
            res.status(500).send("Error adding restaurant");
        });
});
// GET /post-new-item route
app.get('/post-new-item', (req, res) => {
    const restaurantId = req.session.restaurant.restaurantId;
    res.render('post-new-item', { restaurantId: restaurantId });
});

// POST /post-new-item route
app.post('/post-new-item', (req, res) => {
    restaurantData.addFoodItem(req.body)
        .then(() => {
            res.redirect('/restaurant-dashboard'); // Redirect on success
        })
        .catch((err) => {
            console.error("Error adding food item:", err); // Debugging line
            res.status(500).render('post-new-item', {message: "Error adding food item", error: true, restaurantId: req.session.restaurant.restaurantId}); // Render error message
        });
});

// POST /student/update route
app.post("/student/update", (req, res) => {
    restaurantData.updatestudent(req.body)
        .then(() => {
            res.redirect('/students');
        })
        .catch(() => {
            res.status(500).send("Unable to update student");
        });
});

// POST /restraunts/update route
app.post("/restraunts/update", (req, res) => {
    restaurantData.updateRestaurant(req.body)
        .then(() => {
            res.redirect('/restaurants');
        })
        .catch(() => {
            res.status(500).send("Unable to update Restaurant");
        });
});

// GET /register route
app.get("/register", (req, res) => {
    res.render("register"); // Ensure 'register.hbs' exists in the 'views' directory
});

// POST /register route
app.post('/register', (req, res) => {
    const { firstName, lastName, email, password, mobilenumber } = req.body;

    // Hash the password before storing it
    bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) return res.status(500).send('Error hashing password');

        const studentData = {
            firstName,
            lastName,
            email,
            password: hashedPassword,
            mobilenumber,
        };

        // Save the student in the database
        addStudent(studentData)
            .then(() => res.redirect('/login'))
            .catch(err => res.status(500).send('Error registering student'));
    });
});
app.post('/role', (req, res) => {
    const { role } = req.body;

    if (role === 'student') {
        // Render the addStudent.hbs page
        res.render('addStudent');
    } else if (role === 'restaurant') {
        // Render the addrestaurant.hbs page
        res.render('addRestaurant');
    } else {
        res.send('Invalid role selected!');
    }
});

// 404 route
app.use((req, res) => {
    res.status(404).send("Page Not Found");
});

process.on('unhandledRejection', (error, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', error);
    // Optional: process.exit(1); // You can choose to exit the process if it's a critical error
});

// Initialize data and start server
restaurantData.initialize()
    .then(() => {
        app.listen(HTTP_PORT, () => {
            console.log(`Server listening on port: ${HTTP_PORT}`);
        });
    })
    .catch(err => {
        console.log(`Failed to initialize data: ${err}`);
    });
