const express = require('express');
const route = express.Router();


//@route AUth
// THis is for testing 
// @access public 
route.get('/', (req, res) => res.send('Auth Route'))

module.exports = route;
