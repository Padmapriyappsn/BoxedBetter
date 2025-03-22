const Sequelize = require('sequelize');
var sequelize = new Sequelize('SenecaDB', 'SenecaDB_owner', 'o4qptfdThlH6', {
    host: 'ep-nameless-leaf-a58tw4n6-pooler.us-east-2.aws.neon.tech',
    dialect: 'postgres',
    port: 5432,
    dialectOptions: {
        ssl: { rejectUnauthorized: false }
    },
    query: { raw: true },
    logging: console.log
});

// Define the Student model with password field
var Student = sequelize.define('Student', {
    StudentNum: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    firstName: Sequelize.STRING,
    lastName: Sequelize.STRING,
    addressStreet: Sequelize.STRING,
    addressCity: Sequelize.STRING,
    addressProvince: Sequelize.STRING,
    email: Sequelize.STRING,
    mobilenumber: Sequelize.STRING,
    password: {
        type: Sequelize.STRING, // Store the password (hashed, ideally)
        allowNull: false
    }
});

// Define the Restaurant model with password field
var Restaurant = sequelize.define('Restaurant', {
    restaurantId: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    restaurantCode: Sequelize.STRING,
    restaurantName: Sequelize.STRING,
    restaurantDescription: Sequelize.STRING,
    location: Sequelize.STRING,
    owner: Sequelize.STRING,
    email: Sequelize.STRING,
    password: {
        type: Sequelize.STRING, // Store the restaurant password (hashed)
        allowNull: false
    }
});

// Define the Food model
var Food = sequelize.define('Food', {
    foodId: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    foodName: {
        type: Sequelize.STRING,
        allowNull: false
    },
    description: {
        type: Sequelize.STRING,
        allowNull: false
    },
    discountedPrice: {
        type: Sequelize.FLOAT,
        allowNull: false
    },
    restaurantId: {
        type: Sequelize.INTEGER,
        references: {
            model: Restaurant,
            key: 'restaurantId'
        },
        allowNull: false
    }
});

// Define the Order model to track orders placed by students at restaurants
var Order = sequelize.define('Order', {
    orderId: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    orderDetails: Sequelize.STRING, // Can store details like food items, quantities, etc.
    orderStatus: Sequelize.STRING, // For example: "pending", "in progress", "completed"
    foodId: {
        type: Sequelize.INTEGER,
        references: {
            model: Food,
            key: 'foodId'
        },
        allowNull: false
    },
    studentNum: {
        type: Sequelize.INTEGER,
        references: {
            model: Student,
            key: 'StudentNum'
        },
        allowNull: false
    },
    restaurantId: {
        type: Sequelize.INTEGER,
        references: {
            model: Restaurant,
            key: 'restaurantId'
        },
        allowNull: false
    }
});

// Establish relationships
Restaurant.hasMany(Order, { foreignKey: 'restaurantId' });
Student.hasMany(Order, { foreignKey: 'studentNum' });
Order.belongsTo(Restaurant, { foreignKey: 'restaurantId' });
Order.belongsTo(Student, { foreignKey: 'studentNum' });
Order.belongsTo(Food, { foreignKey: 'foodId' });
Restaurant.hasMany(Food, { foreignKey: 'restaurantId' });
Food.belongsTo(Restaurant, { foreignKey: 'restaurantId' });

// Initialize the database
function initialize() {
    return new Promise((resolve, reject) => {
        sequelize.sync()
            .then(() => resolve())
            .catch(() => reject("unable to sync the database"));
    });
}

// Function to get all students
function getAllStudents() {
    return new Promise((resolve, reject) => {
        Student.findAll()
            .then((students) => resolve(students))
            .catch(() => reject("no results returned"));
    });
}

// Function to get all restaurants
function getRestaurants() {
    return new Promise((resolve, reject) => {
        Restaurant.findAll()
            .then((restaurants) => {
                if (restaurants.length > 0) {
                    resolve(restaurants);
                } else {
                    reject("no results returned");
                }
            })
            .catch(() => reject("no results returned"));
    });
}

// Function to get students by restaurant code
function getStudentsByRestaurant(restaurant) {
    return new Promise((resolve, reject) => {
        Student.findAll({
            where: { restaurant: restaurant }
        })
        .then((Students) => {
            if (Students.length > 0) {
                resolve(Students);
            } else {
                reject("no results returned");
            }
        })
        .catch(() => reject("no results returned"));
    });
}

// Function to add a new student
function addStudent(studentData) {
    return new Promise((resolve, reject) => {
        studentData.VIP = studentData.VIP ? true : false;

        for (let property in studentData) {
            if (studentData[property] === "") {
                studentData[property] = null;
            }
        }

        Student.create(studentData)
            .then(() => resolve())
            .catch(() => reject("unable to create student"));
    });
}

// Function to update student information
function updateStudent(studentData) {
    return new Promise((resolve, reject) => {
        studentData.VIP = studentData.VIP ? true : false;

        for (let property in studentData) {
            if (studentData[property] === "") {
                studentData[property] = null;
            }
        }

        Student.update(studentData, {
            where: { StudentNum: studentData.StudentNum }
        })
        .then(() => resolve())
        .catch(() => reject("unable to update student"));
    });
}

// Function to add a new restaurant
function addRestaurant(restaurant) {
    return new Promise((resolve, reject) => {
        if (!restaurant.restaurantCode || !restaurant.restaurantName || !restaurant.location || !restaurant.owner || !restaurant.restaurantDescription || !restaurant.email || !restaurant.password) {
            reject("Missing required fields");
        } else {
            Restaurant.create(restaurant);
            resolve();
        }
    });
}

// Function to update restaurant information
function updateRestaurant(restaurantData) {
    return new Promise((resolve, reject) => {
        for (let property in restaurantData) {
            if (restaurantData[property] === "") {
                restaurantData[property] = null;
            }
        }

        Restaurant.update(restaurantData, {
            where: { restaurantId: restaurantData.restaurantId }
        })
        .then(([affectedRows]) => {
            if (affectedRows > 0) {
                resolve();
            } else {
                reject("no restaurant found with the provided restaurantId");
            }
        })
        .catch(() => reject("unable to update restaurant"));
    });
}

// Function to delete restaurant by ID
function deleteRestaurantById(id) {
    return new Promise((resolve, reject) => {
        Restaurant.destroy({
            where: { restaurantId: id }
        })
        .then((affectedRows) => {
            if (affectedRows > 0) {
                resolve();
            } else {
                reject("no restaurant found with the provided restaurantId");
            }
        })
        .catch(() => reject("unable to delete restaurant"));
    });
}

// Function to delete student by ID
function deleteStudentById(StudentNum) {
    return new Promise((resolve, reject) => {
        Student.destroy({
            where: { StudentNum: StudentNum }
        })
        .then(deletedCount => {
            if (deletedCount > 0) {
                resolve();
            } else {
                reject(new Error('Student not found'));
            }
        })
        .catch(err => reject(err));
    });
}

// Function to get a restaurant by its ID
function getRestaurantById(restaurantId) {
    return new Promise((resolve, reject) => {
        Restaurant.findOne({
            where: { restaurantId: restaurantId }
        })
        .then((restaurant) => {
            if (restaurant) {
                resolve(restaurant);
            } else {
                reject("No restaurant found with the provided restaurantId");
            }
        })
        .catch(() => reject("Unable to fetch restaurant"));
    });
}
// Function to get a student by their ID
function getStudentById(studentId) {
    return new Promise((resolve, reject) => {
        Student.findOne({
            where: { StudentNum: studentId }  // Assuming the column name is 'studentId' in your DB
        })
        .then((student) => {
            if (student) {
                resolve(student);
            } else {
                reject("No student found with the provided studentId");
            }
        })
        .catch(() => reject("Unable to fetch student"));
    });
}

function addstudent(studentData) {
    return new Promise((resolve, reject) => {
        // You might want to hash passwords before saving, and then create the student in the DB
        Student.create(studentData)
            .then(() => resolve())
            .catch(err => reject('Unable to add student to the database'));
    });
}


// Function to add an order
function addOrder(orderData) {
    return new Promise((resolve, reject) => {
        Order.create(orderData)
            .then(() => resolve())
            .catch(() => reject("unable to create order"));
    });
}

// Function to add a food item
function addFoodItem(foodData) {
    return new Promise((resolve, reject) => {
        if (!foodData.foodName || !foodData.description || !foodData.discountedPrice || !foodData.restaurantId) {
            reject("Missing required fields for food item");
        } else {
            Food.create(foodData)
                .then(() => resolve())
                .catch((err) => reject("Unable to add food item: " + err.message));  // Include error message
        }
    });
}

// Function to update a food item
function updateFoodItem(foodData) {
    return new Promise((resolve, reject) => {
        if (!foodData.foodId || !foodData.foodName || !foodData.description || !foodData.discountedPrice) {
            reject("Missing required fields for food item");
        } else {
            Food.update(foodData, {
                where: { foodId: foodData.foodId }
            })
            .then(([affectedRows]) => {
                if (affectedRows > 0) {
                    resolve();
                } else {
                    reject("No food item found with the provided foodId");
                }
            })
            .catch(() => reject("Unable to update food item"));
        }
    });
}

// Function to delete a food item
function deleteFoodItem(foodId) {
    return new Promise((resolve, reject) => {
        Food.destroy({
            where: { foodId: foodId }
        })
        .then((affectedRows) => {
            if (affectedRows > 0) {
                resolve();
            } else {
                reject("No food item found with the provided foodId");
            }
        })
        .catch(() => reject("Unable to delete food item"));
    });
}

// Function to get all food items for a specific restaurant
function getFoodByRestaurantId(restaurantId) {
    return new Promise((resolve, reject) => {
        Food.findAll({
            where: { restaurantId: restaurantId }
        })
        .then((foods) => {
            if (foods.length > 0) {
                resolve(foods);
            } else {
                reject("No food items found for the specified restaurant");
            }
        })
        .catch(() => reject("Unable to fetch food items"));
    });
}

// Function to get all orders for a student
function getOrdersByStudent(studentNum) {
    return new Promise((resolve, reject) => {
        Order.findAll({
            where: { studentNum: studentNum }
        })
        .then((orders) => {
            if (orders.length > 0) {
                resolve(orders);
            } else {
                reject("No orders found for this student");
            }
        })
        .catch(() => reject("Unable to fetch orders"));
    });
}

// Function to get all orders for a restaurant
function getOrdersByRestaurant(restaurantId) {
    return new Promise((resolve, reject) => {
        Order.findAll({
            where: { restaurantId: restaurantId }
        })
        .then((orders) => {
            if (orders.length > 0) {
                resolve(orders);
            } else {
                reject("No orders found for this restaurant");
            }
        })
        .catch(() => reject("Unable to fetch orders"));
    });
}
// Function to add a food item with discount to the database
function postFoodDiscount(foodData) {
    return new Promise((resolve, reject) => {
        if (!foodData.foodName || !foodData.description || !foodData.discountedPrice || !foodData.restaurantId) {
            reject("Missing required fields for food item");
        } else {
            Food.create(foodData)
                .then(() => resolve())
                .catch(() => reject("Unable to post food item"));
        }
    });
}

// Export functions
module.exports = { 
    initialize, 
    Student,
    Restaurant,
    Food,
    Order,
    getAllStudents, 
    getRestaurants,
    getStudentById,
    getStudentsByRestaurant, 
    addStudent,
    updateStudent,
    getRestaurantById, 
    addRestaurant, 
    updateRestaurant, 
    deleteRestaurantById, 
    deleteStudentById,
    addOrder,
    getOrdersByStudent, 
    getOrdersByRestaurant, 
    addFoodItem,
    updateFoodItem, 
    deleteFoodItem,
    getFoodByRestaurantId,
    postFoodDiscount
};
