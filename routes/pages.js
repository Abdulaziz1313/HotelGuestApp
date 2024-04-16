const express = require('express');
const authController = require('../controllers/auth');

const router = express.Router();

router.get('/', authController.isLoggedIn, (req, res) => {
    res.render('index' , {
    user: req.user
    })
});

router.get('/register', (req, res) => {
    res.render('register')
});

router.get('/login', (req, res) => {
    res.render('login')
});


router.get('/hotelRegis', (req, res) => {
    res.render('hotelRegis')
});

router.get('/chatAs', (req, res) => {
    res.render('chatAs')
});

router.get('/roomCR', (req, res) => {
    res.render('roomCR')
})

router.get('/bookAtaxi', (req, res) => {
    res.render('bookAtaxi')
})

router.get('/mealCR', (req, res) => {
    res.render('mealCR')
})

router.get('/orderMeal', authController.isLoggedIn, (req, res) => {
    if(req.user) {
    res.render('orderMeal', {
    user: req.user
    });
} else {
    res.redirect('/login');
}
});

router.get('/bookAroom', authController.isLoggedIn, (req, res) => {
    if(req.user) {
    res.render('bookAroom', {
    user: req.user
    });
} else {
    res.redirect('/login');
}
});

router.get('/profile', authController.isLoggedIn ,(req, res) => {
    
    if(req.user ) {
    res.render('profile', {
        user: req.user
    });
    } else {
        res.redirect('/login');
    }
    
});

module.exports = router;
