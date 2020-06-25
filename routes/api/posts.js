const express = require('express');
const router = express.Router();
//import { model } from 'mongoose';


//@route api/posts
// THis is for testing 
// @access public 
router.get('/', (req, res) => res.send('Profile Route'))

module.exports = router;
//export default route;
