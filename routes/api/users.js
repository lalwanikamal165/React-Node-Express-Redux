const express = require('express');
const router = express.Router();
//const config = require('config');
//const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const gravatar = require('gravatar');
const { check, validationResult } = require('express-validator');
const User = require('../../models/User');

//const jwtSecret = config.get('jwtSecret');
//@desc   Register user
//@req    POST /api/users
//access  Public

// router.post('/', (req, res) => {
//     console.log("req");
//     console.log(req);
//     console.log(req.body);
//     res.send('User Route');
// });

router.post(
    '/',
    [
        check('name', 'Name is required').not().isEmpty(),
        check('email', 'Please enter the email').isEmail(),
        check('password', 'Please enter password with 6 or more digits').isLength({
            min: 6,
        }),
    ],
    async (req, res) => {
        console.log(req.body);
        console.log("Test");
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { name, email, password } = req.body;
        try {
            //check if user already exist in the DB
            let user = await User.findOne({ email });
            if (user) {
                return res
                    .status(400)
                    .json({ errors: [{ msg: 'User Already exist' }] });
            }
            //Get user gravatar
            const avatar = gravatar.url(email, {
                s: '200',
                r: 'pg',
                d: 'mm',
            });
            user = new User({
                name,
                email,
                avatar,
                password,
            });
            //Encrypt password
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(password, salt);
            await user.save();
            //Return JWT since in the UI I want user to login imediet alfter registration
            // const payload = {
            //     user: {
            //         id: user.id,
            //     },
            // };
            // jwt.sign(
            //     payload,
            //     jwtSecret,
            //     {
            //         expiresIn: 360000,
            //     },
            //     (err, token) => {
            //         if (err) throw err;
            //         res.json({ token });
            //     }
            // );
        } catch (error) {
            res.status(500).json({ msg: 'Server error' });
        }
    }
);

module.exports = router;