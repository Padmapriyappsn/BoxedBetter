const HTTP_PORT = process.env.PORT || 8080;
const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const restaurantData = require("./modules/restaurantData");
const exphbs = require('express-handlebars');
const bcrypt = require('bcryptjs');  // For hashing the password

const app = express();
const session = require('express-session');

const { Student, Restaurant, Order, Food,Review } = require('./modules/restaurantData');  // Path to restrauntData.js
const { getRestaurants, getFoodByRestaurantId, addFoodItem , deleteFoodItem, getAllFoodItems, addReview, getReviewsByRestaurantId, getStudentById} = require('./modules/restaurantData');  // Path to restrauntData.js

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
app.get("/student/:StudentId", (req, res) => { 
    let viewData = {}; 
    restaurantData.getStudentById(req.params.StudentId)
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
app.get("/student/delete/:StudentId", (req, res) => {
    restaurantData.deleteStudentById(parseInt(req.params.StudentId, 10))
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
                //console.log("Stored password:", student.password);
                //console.log("Entered password:", password);             
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

    getAllFoodItems()
        .then(foods => {
            res.render('student-dashboard', {
                student: req.session.student,
                foods: foods // Pass the foods array to the template
            });
        })
        .catch(err => {
            console.error("Error fetching all food items:", err);
            res.status(500).send('Error fetching food items.');
        });
});
//display restaurant dashboard to post food items 
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

// Route to handle viewing an order (if needed, typically GET is used for viewing)
// If you want to use POST, you might be sending data to filter orders.
app.post('/student/view-order', async (req, res) => {
    try {
        const { orderId } = req.body; // Example: orderId from the request body
        const StudentId = req.session.StudentId;

        // Validation
        if (!orderId || !StudentId) {
            return res.status(400).send('Missing order ID.');
        }

        // Logic to fetch order details from the database
        const orderDetails = await getOrdersByStudent(StudentId); // Replace with your function

        if (!orderDetails) {
            return res.status(404).send('Order not found.');
        }

        res.json(orderDetails);
    } catch (error) {
        console.error('Error viewing order:', error);
        res.status(500).send('Internal Server Error');
    }
});


// Route to render pickup orders page (for restaurant staff)
app.get('/pickuporder', async (req, res) => {
    const readyOrders = await restaurantData.getReadyOrders();
    res.render('pickuporder', { readyOrders });
});

// Route to handle placing an order
app.post('/student/orders', async (req, res) => {
    try {
        if (!req.session.student) {
            return res.redirect('/login'); // Ensure only logged-in students can place orders
        }

        const { foodId, quantity } = req.body;
        const StudentId = req.session.student.StudentId;

        if (!foodId || !quantity || quantity <= 0) {
            return res.status(400).send('Invalid food item or quantity');
        }

        // Fetch food details
        const foodItem = await Food.findByPk(foodId, {
            include: [{ model: Restaurant }]
        });

        console.log("Fetched Food Item:", foodItem); // DEBUGGING: Log output

        if (!foodItem) {
            return res.status(404).send('Food item not found');
        }

        // Check if Restaurant association exists
        console.log("FoodItem.Restaurant:", foodItem.Restaurant);

        const restaurantId = foodItem.Restaurant?.restaurantId;
        if (!restaurantId) {
            return res.status(500).send("Restaurant association missing for food item.");
        }

        const totalPrice = foodItem.discountedPrice * quantity;

        // Create the order
        await Order.create({
            foodId,
            StudentId,
            restaurantId,
            orderDetails: `Ordered ${quantity}x ${foodItem.foodName}`,
            orderStatus: 'pending',
            totalPrice
        });

        console.log("Order placed successfully!");
        res.redirect('/student/orders');

    } catch (error) {
        console.error('Error placing order:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Route to handle viewing orders (GET)
app.get('/student/orders', async (req, res) => {
    if (!req.session.student) {
        return res.redirect('/login'); // Ensure only logged-in students can view their orders
    }

    const StudentId = req.session.student.StudentId;

    try {
        // Fetch orders with related Food and Restaurant data
        const orders = await Order.findAll({
            where: { StudentId: studentId },
            include: [
                { model: Food, as: 'foodItem' },     // Include related Food
                { model: Restaurant, as: 'restaurant' } // Include related Restaurant
            ]
        });

        // Render orders page with the fetched orders data
        res.render('student-orders', { orders });
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).send('Error fetching orders');
    }
});
// Route to track an order (GET instead of POST)
app.get('/track-order/:orderId', async (req, res) => {
    try {
        const { orderId } = req.params;
        const StudentId = req.session.student?.StudentId;

        if (!StudentId) {
            return res.redirect('/login');
        }

        const trackingInfo = await fetchOrderTracking(orderId, StudentId);
        if (!trackingInfo) {
            return res.status(404).send('Tracking information not found.');
        }

        res.json(trackingInfo);
    } catch (error) {
        console.error('Error tracking order:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Route to render the restaurants page to leave a review
app.get("/restaurants", async (req, res) => {
    try {
        const restaurants = await restaurantData.getRestaurants();
        if (restaurants.length > 0) {
            res.render("restaurants", { restaurants: restaurants });
        } else {
            res.render("restaurants", { message: "No restaurants found" });
        }
    } catch (error) {
        console.error('Error fetching restaurants:', error);
        res.render("restaurants", { message: "No restaurants found" });
    }
});

// Route to render the review form
app.get('/restaurant/:id/review', async (req, res) => {
    try {
        if (!req.session.student) {
            return res.redirect('/login');
        }
        const restaurantId = req.params.id;
        const StudentId = req.session.student.StudentId;
        const student = await getStudentById(StudentId);
        res.render('reviewrestaurant', { restaurantId: restaurantId, student: student });
    } catch (error) {
        console.error('Error rendering review form:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Route to handle submitting a review
/*app.post('/restaurant/:id/review', async (req, res) => {
    try {
        if (!req.session.student) {
            return res.redirect('/login');
        }
        const restaurantId = req.params.id;
        const StudentId = req.session.student.StudentId;
        const { rating, comment } = req.body;

        const reviewData = {
            restaurantId: restaurantId,
            StudentId: StudentId,
            rating: rating,
            comment: comment
        };

        await addReview(reviewData);
        res.redirect(`/restaurant/${restaurantId}`); // Redirect back to the restaurant page
    } catch (error) {
        console.error('Error submitting review:', error);
        res.status(500).send('Internal Server Error');
    }
});*/
app.post('/restaurant/:id/review', async (req, res) => {
    try {
        console.log("Restaurant ID:", req.params.id);
        console.log("Request Body:", req.body);
        console.log("Session Student:", req.session.student);

        if (!req.session.student) {
            return res.redirect('/login');
        }

        const restaurantId = req.params.id;
        const StudentId = req.session.student.StudentId;

        console.log("Student ID from Session:", StudentId); // Check this line

        const { rating, comment } = req.body;

        const reviewData = {
            restaurantId: restaurantId,
            StudentId: StudentId, // Make sure this is the correct variable
            rating: rating,
            comment: comment
        };

        console.log("Review Data Before addReview:", reviewData);

        await addReview(reviewData);
        res.redirect(`/student-dashboard`);
    } catch (error) {
        console.error('Error submitting review:', error);
        res.status(500).send('Internal Server Error');
    }
});
// Route to show reviews on the restaurant page
app.get('/restaurant/:id', async (req, res) => {
    try {
        const restaurantId = req.params.id;
        const restaurant = await restaurantData.getRestaurantById(parseInt(restaurantId));
        const reviews = await getReviewsByRestaurantId(restaurantId);

        if (restaurant) {
            res.render("restaurant", { restaurant: restaurant, reviews: reviews });
        } else {
            res.status(404).send("Restaurant Not Found");
        }
    } catch (error) {
        console.error('Error fetching restaurant or reviews:', error);
        res.render("restaurant", { message: "No results for restaurant" });
    }
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
