const HTTP_PORT = process.env.PORT || 8080;
const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const restaurantData = require("./modules/restaurantData");
const exphbs = require('express-handlebars');

const app = express();

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
            res.render("addstudent", { restaurants: data });
        })
        .catch(() => {
            res.render("addstudent", { restaurants: [] });
        });
});

// GET /restaurants/add route
app.get("/restaurants/add", (req, res) => {
    res.render("addRestaurant"); // Ensure 'addRestaurant.hbs' exists in the 'views' directory
});

// GET /login route
app.get("/login", (req, res) => {
    res.render("login");  // Ensure 'login.hbs' exists in the 'views' directory
});

// POST /students/add route
app.post('/students/add', (req, res) => {
    restaurantData.addstudent(req.body)
        .then(() => {
            res.redirect('/students');
        })
        .catch(() => {
            res.status(500).send('Error adding student');
        });
});

// POST /restaurants/add route
app.post("/restaurants/add", (req, res) => {
    restaurantData.addRestaurant(req.body)
        .then(() => {
            res.redirect('/restaurants');
        })
        .catch(() => {
            res.status(500).send("Error adding restaurant");
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

// GET /register route
app.get("/register", (req, res) => {
    res.render("register"); // Ensure 'register.hbs' exists in the 'views' directory
});

// POST /register route
app.post("/register", (req, res) => {
    const { role } = req.body;
    if (role === "student") {
        res.redirect("/students/add");
    } else if (role === "restaurant") {
        res.redirect("/restaurants/add");
    } else {
        res.status(400).send("Invalid role selected");
    }
});

// 404 route
app.use((req, res) => {
    res.status(404).send("Page Not Found");
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
