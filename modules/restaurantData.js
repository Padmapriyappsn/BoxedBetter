const Sequelize = require('sequelize');
var sequelize = new Sequelize('SenecaDB', 'SenecaDB_owner', 'o4qptfdThlH6', {
    //host: 'ep-nameless-leaf-a58tw4n6.us-east-2.aws.neon.tech',
    host: 'ep-nameless-leaf-a58tw4n6-pooler.us-east-2.aws.neon.tech',
    dialect: 'postgres',
    port: 5432,
    dialectOptions: {
        ssl: { rejectUnauthorized: false }
    },
    query: { raw: true },
    logging: console.log
});

// Define the Student model
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
});

// Define the Restaurant model
var Restaurant = sequelize.define('Restaurant', {
    restaurantId: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    restaurantCode: Sequelize.STRING,
    restaurantName: Sequelize.STRING,
    location : Sequelize.STRING,
    owner: Sequelize.STRING
});

// Establish the relationship
Restaurant.hasMany(Student, { foreignKey: 'restaurant' });

function initialize() {
    return new Promise((resolve, reject) => {
        sequelize.sync()
            .then(() => resolve())
            .catch(() => reject("unable to sync the database"));
    });
}

function getAllStudents() {
    return new Promise((resolve, reject) => {
        Student.findAll()
            .then((Students) => resolve(Students))
            .catch(() => reject("no results returned"));
    });
}

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

function getStudentById(num) {
    return new Promise((resolve, reject) => {
        Student.findAll({
            where: { StudentNum: num }
        })
        .then((Students) => {
            if (Students.length > 0) {
                resolve(Students[0]);
            } else {
                reject("no results returned");
            }
        })
        .catch(() => reject("no results returned"));
    });
}

function addstudent(StudentData) {
    return new Promise((resolve, reject) => {
        StudentData.VIP = StudentData.VIP ? true : false;

        for (let property in StudentData) {
            if (StudentData[property] === "") {
                StudentData[property] = null;
            }
        }

        Student.create(StudentData)
            .then(() => resolve())
            .catch(() => reject("unable to create Student"));
    });
}

function updateStudent(StudentData) {
    return new Promise((resolve, reject) => {
        StudentData.VIP = StudentData.VIP ? true : false;

        for (let property in StudentData) {
            if (StudentData[property] === "") {
                StudentData[property] = null;
            }
        }

        Student.update(StudentData, {
            where: { StudentNum: StudentData.StudentNum }
        })
        .then(() => resolve())
        .catch(() => reject("unable to update Student"));
    });
}

function getRestaurantById(id) {
    return new Promise((resolve, reject) => {
        Restaurant.findAll({
            where: { restaurantId: id }
        })
        .then((restaurants) => {
            if (restaurants.length > 0) {
                resolve(restaurants[0]);
            } else {
                reject("no results returned");
            }
        })
        .catch(() => reject("no results returned"));
    });
}

function addRestaurant(restaurantData) {
    return new Promise((resolve, reject) => {
        for (let property in restaurantData) {
            if (restaurantData[property] === "") {
                restaurantData[property] = null;
            }
        }

        Restaurant.create(restaurantData)
            .then(() => resolve())
            .catch(() => reject("unable to create restaurant"));
    });
}

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

module.exports = { 
    initialize, 
    getAllStudents, 
    getRestaurants, 
    getStudentsByRestaurant, 
    getStudentById, 
    addstudent, 
    updateStudent, 
    getRestaurantById, 
    addRestaurant, 
    updateRestaurant, 
    deleteRestaurantById, 
    deleteStudentById
};
