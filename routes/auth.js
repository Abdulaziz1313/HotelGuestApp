const express = require('express');
const mysql = require("mysql");
const authController = require('../controllers/auth');

const router = express.Router();

router.post('/register', authController.register);

router.post('/login', authController.login);

router.get('/logout', authController.logout);

router.post('/hotelRegis', authController.hotelRegis);

router.get('/roomCR', authController.roomCR);

router.get('/mealCR', authController.mealsS);

router.post('/createMeal', authController.createMeal);

router.post('/createRoom', authController.createRoom);

router.post('/updateMeal', authController.updateMeal);

router.get('/bookAroom', authController.bookAroom);

router.post('/bookedRoom', authController.bookedRoom);

router.get('/orderMeal', authController.mealOrD);

router.post('/bookedMeal', authController.bookedMeal);

router.post('/bookTaxi', authController.bookTaxi);

module.exports = router;
