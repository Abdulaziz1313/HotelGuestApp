const mysql = require("mysql");
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const {promisify} = require('util');
const router = require("../routes/pages");
const axios = require('axios');

const abduldatabase = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE
});

exports.login = async (req, res) => {

    try {

        const { email, password } = req.body;

        if( !email || !password ) {
            return res.status(400).render('login', {
                message: 'Please provide an email and password'
            })
        }

        abduldatabase.query('SELECT * FROM users WHERE email = ?', [email], async (error, results) => {
            console.log(results);
            if(!results || !(await bcrypt.compare(password, results[0].password)) ){
                res.status(401).render('login', {
                    message: 'Email or Password is incorrect!!!'
                })
            } else {
                const id = results[0].id;

                const token = jwt.sign({ id }, process.env.JWT_SECRET, {
                    expiresIn: process.env.JWT_EXPIRES_IN
                });

                console.log("The token is: " + token);
                
                const cookieOptions = {
                    expires: new Date (
                        Date.now() + process.env.JWT_COOKIE_EXPIRES * 24 * 60 * 60 * 1000
                    ),
                    httpOnly: true
                }

                res.cookie('jwt', token, cookieOptions );
                res.status(200).redirect("/")
            }
        })
        
    } catch (error) {
        console.log(error);
    }
};



exports.register = (req, res) => {
   console.log(req.body);
  

   const { name, email, password, passwordConfirm} = req.body;

   abduldatabase.query('SELECT email FROM users WHERE email = ?', [email], async (error, results) => {
    if(error){
        console.log(error);
    }

    if ( results.length > 0) {
        return res.render('register', {
            message: 'That email is already in use'
        })
    } else if( password !== passwordConfirm ) {
        return res.render('register', {
            message: 'Password do not match'
        });
    }

    let hashedPassword = await bcrypt.hash(password, 8);
    console.log(hashedPassword);

    abduldatabase.query('INSERT INTO users SET ? ', { name: name, email: email, password: hashedPassword }, (error, results) => {
        if(error) {
            console.log(error);
        } else {
            return res.render('register', {
                message: 'You have registered you can now login:)'
            });
        }
    })

   })

   
}



exports.hotelRegis = async (req, res) => {
    console.log(req.body);
   
    const {name, email, password, passwordConfirm, hotelName, country, city, telephoneNumber } = req.body;

    // Check if the hotel already exists
    abduldatabase.query('SELECT email FROM hotels WHERE email = ?', [email], async (error, results) => {
        if(error){
            console.log(error);
            return res.status(500).send('Internal Server Error');
        }

        console.log("Results length:", results.length);

        if (results.length > 0) {
            console.log("Email already exists");
            return res.render('hotelRegis', {
                message: 'That email is already registered'
            });
        } else if( password !== passwordConfirm ) {
            console.log("Passwords do not match");
            return res.render('hotelRegis', {
                message: 'Password do not match'
            });
        } else {
            console.log("Passwords match, proceeding with registration");
            // Passwords match, proceed with registration
            let hashedPassword = await bcrypt.hash(password, 8);
            console.log(hashedPassword);
            
            // Insert into the hotels table
            abduldatabase.query('INSERT INTO hotels SET ?', {name:name, password: hashedPassword, email:email, hotelName: hotelName, country: country, city: city, telephoneNumber: telephoneNumber }, (error, results) => {
                if(error) {
                    console.log(error);
                    return res.status(500).send('Internal Server Error');
                } 
                
                const hotelId = results.insertId; // Get the auto-generated hotel ID
                
                // Insert into the users table
                abduldatabase.query('INSERT INTO users (hotelId, name, email, password) VALUES (?,?,?,?)', [hotelId, name, email, hashedPassword], (error, results) => {
                    if(error) {
                        console.log(error);
                        return res.status(500).send('Internal Server Error');
                    } 
    
                    return res.render('hotelRegis', {
                        message: 'Your hotel has been registered successfully.'
                    });
                });
            });
        }
    });
}



exports.isLoggedIn = async (req, res, next) => {
    console.log(req.cookies);
    if(req.cookies.jwt) {
        try {
            //1) verify the token
            const decoded = await promisify(jwt.verify)(req.cookies.jwt,
            process.env.JWT_SECRET
            );

            console.log(decoded);

            //2) Check if the user still exists
            abduldatabase.query('SELECT * FROM users WHERE id = ?', [decoded.id], (error, result) => {
                console.log(result);

                if(!result) {
                    return next();
                }

                req.user = result[0];
                return next();
            });
        } catch (error) {
            console.log(error)
            return next();
            
        }
    } else {
      next();
    }
    
}

exports.logout = async (req, res, next) => {
    res.cookie('jwt', 'logout', {
        expires: new Date(Date.now() + 2*1000),
        httpOnly: true
    });

    res.status(200).redirect('/');
}



exports.createRoom = (req, res) => {
    console.log(req.body);
   
 
    const { roomID, roomNumber, roomType, price, capacity} = req.body;
 
    abduldatabase.query('SELECT roomID FROM rooms WHERE roomID = ?', [roomID], async (error, results) => {
     if(error){
         console.log(error);
     }
 
     if ( results.length > 0) {
         return res.render('roomCR', {
             message: 'That room is already existed'
         })
     }
 
  
 
     abduldatabase.query('INSERT INTO rooms SET ? ', { roomNumber: roomNumber, roomType: roomType, price: price, capacity: capacity }, (error, results) => {
         if(error) {
             console.log(error);
         } else {
             return res.render('roomCR', {
                 message: 'The room have been created:)'
             });
         }
     })
 
    })
 
    
 }


exports.roomCR = (req, res) => {
    console.log(req.body);
    //const { roomNumber, roomType, capacity, price } = req.body;

    const query = "SELECT roomID, roomNumber, roomType, capacity, price FROM rooms ORDER BY roomID DESC";
    console.log(query);

    // Execute the query
    abduldatabase.query(query, function (error, data) {
        if (error) {
            console.log(error);
            return res.status(500).send('Internal Server Error'); // Return a 500 error response
        } else {
            console.log(data); // Check if data is logged correctly

            // Render the "bookAroom" view and pass the retrieved room data to it
            return res.render('roomCR', {
                title: 'Node.js MySQL CRUD Application',
                action: 'list',
                bookRooms: data // Pass the retrieved room data to the view
            });
        }
    });
};






 exports.bookAroom = (req, res) => {
    console.log(req.body);
    //const { roomNumber, roomType, capacity, price } = req.body;

    const query = "SELECT roomID, roomNumber, roomType, capacity, price FROM rooms ORDER BY roomID DESC";
    console.log(query);

    // Execute the query
    abduldatabase.query(query, function (error, data) {
        if (error) {
            console.log(error);
            return res.status(500).send('Internal Server Error'); // Return a 500 error response
        } else {
            console.log(data); // Check if data is logged correctly

            // Render the "bookAroom" view and pass the retrieved room data to it
            return res.render('bookAroom', {
                title: 'Node.js MySQL CRUD Application',
                action: 'list',
                bookRooms: data // Pass the retrieved room data to the view
            });
        }
    });
};


 

 
exports.bookedRoom = (req, res) => {
    console.log(req.body);
   
    const {name, email, checkin, checkout, roomID} = req.body;

    // Check if the hotel already exists
    abduldatabase.query('SELECT roomID FROM rooms WHERE roomID = ?', [roomID], async (error, results) => {
        if(error){
            console.log(error);
            return res.status(500).send('Internal Server Error');
        }

        if (results.length > 0) {
            return res.render('bookAroom', {
                message: 'That room is no longer available'
            })
        } 
    
    })
    abduldatabase.query('INSERT INTO bookedroom SET ? ', { name: name, email: email, checkin: checkin, checkout: checkout }, (error, results) => {
        if(error) {
            console.log(error);
        } else {
            return res.render('bookAroom', {
                message: 'The room has been booked successfully:)'
            });
        }

       })
    
};



exports.mealsS = (req, res) => {
    console.log(req.body);
    //const { roomNumber, roomType, capacity, price } = req.body;

    const query = "SELECT mealID, mealName, recipe, price FROM meals ORDER BY mealID DESC";
    console.log(query);

    // Execute the query
    abduldatabase.query(query, function (error, data) {
        if (error) {
            console.log(error);
            return res.status(500).send('Internal Server Error'); // Return a 500 error response
        } else {
            console.log(data); // Check if data is logged correctly

            // Render the "bookAroom" view and pass the retrieved room data to it
            return res.render('mealCR', {
                title: 'Node.js MySQL CRUD Application',
                action: 'list',
                creatMeal: data // Pass the retrieved room data to the view
            });
        }
    });
};



exports.createMeal = (req, res) => {
    console.log(req.body);
   
 
    const { mealID, mealName, recipe, price} = req.body;
 
    abduldatabase.query('SELECT mealID FROM meals WHERE mealID = ?', [mealID], async (error, results) => {
     if(error){
         console.log(error);
     }
 
     if ( results.length > 0) {
         return res.render('mealCR', {
             message: 'That meal is already existed'
         })
     }
 
  

     abduldatabase.query('INSERT INTO meals SET ? ', { mealName: mealName, recipe: recipe, price: price}, (error, results) => {
         if(error) {
             console.log(error);
         } else {
             return res.render('mealCR', {
                 message: 'The meal have been created:)'
             });
         }
     })
 
    })
 
    
 }


 // Update meal details in the database
exports.updateMeal = (req, res) => {
    const { mealID, mealName, recipe, price } = req.body;

    // Update the meal record in the database
    abduldatabase.query(
        'UPDATE meals SET mealName = ?, recipe = ?, price = ? WHERE mealID = ?',
        [mealName, recipe, price, mealID],
        (error, results) => {
            if (error) {
                console.log(error);
                return res.status(500).send('Internal Server Error');
            }
            return res.redirect('/'); // Redirect to some page after updating successfully
        }
    );
};



exports.bookedMeal = (req, res) => {
    console.log(req.body);
   
    const { mealID, roomNumber, numberOfppl, drinks } = req.body;

    // Check if the meal exists
    abduldatabase.query('SELECT mealID FROM meals WHERE mealID = ?', [mealID], async (error, results) => {
        if (error) {
            console.log(error);
            return res.status(500).send("An error occurred while checking for the meal. Please try again later.");
        }

        if (results.length === 0) {
            return res.render('orderMeal', {
                message: 'That meal does not exist.'
            });
        }

        // If the meal exists, proceed to insert the order
        abduldatabase.query('INSERT INTO mealordered SET ?', { mealID: mealID, roomNumber: roomNumber, numberOfppl: numberOfppl, drinks: drinks }, (error, results) => {
            if (error) {
                console.log(error);
                return res.status(500).send("An error occurred while ordering the meal. Please try again later.");
            } else {
                return res.render('orderMeal', {
                    message: 'The meal has been ordered successfully.'
                });
            }
        });
    });
};




exports.mealOrD = (req, res) => {
    console.log(req.body);
    //const { roomNumber, roomType, capacity, price } = req.body;

    const query = "SELECT mealID, mealName, recipe, price FROM meals ORDER BY mealID DESC";
    console.log(query);

    // Execute the query
    abduldatabase.query(query, function (error, data) {
        if (error) {
            console.log(error);
            return res.status(500).send('Internal Server Error'); // Return a 500 error response
        } else {
            console.log(data); // Check if data is logged correctly

            // Render the "bookAroom" view and pass the retrieved room data to it
            return res.render('orderMeal', {
                title: 'Node.js MySQL CRUD Application',
                action: 'list',
                creatMeal: data // Pass the retrieved room data to the view
            });
        }
    });
};




exports.bookTaxi = async (req, res) => {
    try {
        const { pickupLocation, destination } = req.body;

        // Make a request to the Uber API to book a taxi
        const response = await axios.post('https://uberapi.com/bookings', {
            pickupLocation,
            destination,
            // Add any other required parameters here
        });

        // Check if the booking was successful
        if (response.data.success) {
            // Handle success case
            res.status(200).json({ message: 'Taxi booked successfully!' });
        } else {
            // Handle error case
            res.status(400).json({ message: 'Failed to book taxi. Please try again later.' });
        }
    } catch (error) {
        // Handle any errors that occur during the API request
        console.error('Error booking taxi:', error);
        res.status(500).json({ message: 'An error occurred while booking taxi. Please try again later.' });
    }
};