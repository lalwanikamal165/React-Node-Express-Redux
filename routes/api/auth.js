const express = require('express');
const route = express.Router();
const User = require('../../modals/User');
const auth = require('../../middleware/auth');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const config = require('config');
const jwtSecret = config.get('jwtSecret');
const { check, validationResult } = require('express-validator');
//@desc   Get auth
//@req    GET /api/auth
//access  Public
route.get('/', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (error) {
        console.log(error);
        res.status(500).send('Server error');
    }
});

//@desc   Authenticate user and get token
//@req    POST /api/auth
//access  Public

route.post(
    '/',
    [
        check('email', 'Please enter the email').isEmail(),
        check('password', 'Password is required').exists(),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { email, password } = req.body;
        try {
            //check if user already exist in the DB
            let user = await User.findOne({ email });
            if (!user) {
                return res.status(400).json({
                    errors: [{ msg: 'User does not exist or invalid credentials' }],
                });
            }

            //compare password
            const isMatch = await bcrypt.compare(password, user.password);

            if (!isMatch) {
                return res.status(400).json({
                    errors: [{ msg: 'User does not exist or invalid credentials' }],
                });
            }
            //Return JWT since in the UI I want user to login imediet alfter registration
            const payload = {
                user: {
                    id: user.id,
                },
            };
            jwt.sign(
                payload,
                jwtSecret,
                {
                    expiresIn: 360000,
                },
                (err, token) => {
                    if (err) throw err;
                    res.json({ token });
                }
            );
        } catch (error) {
            console.log(error);
            res.status(500).json({ msg: 'Server error' });
        }
    }
);

module.exports = route;
