const express = require('express');
const auth = require('../../middleware/auth');
const axios = require('axios');
const config = require('config');
const Profile = require('../../models/Profile');
const normalizeUrl = require('normalize-url');
const User = require('../../modals/User');
const { check, validationResult } = require('express-validator');
const router = express.Router();

//@desc   Get current users profile or Get logged in profile
//@req    GET /api/profile/me
//access  Private
router.get('/me', auth, async (req, res) => {
    try {
        const profile = await Profile.findOne({
            user: req.user.id,
        }).populate('user', ['name', 'avatar']);
        if (!profile) {
            return res.status(400).json({ msg: 'User does not have profile' });
        }
        res.status(200).json({ profile });
    } catch (error) {
        return res.status(500).send('Server Error');
    }
});

// @route    POST api/profile
// @desc     Create or update user profile
// @access   Private
router.post(
    '/',
    [
        auth,
        [
            check('status', 'Status is required').not().isEmpty(),
            check('skills', 'Skills is required').not().isEmpty(),
        ],
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const {
            company,
            location,
            website,
            bio,
            skills,
            status,
            githubusername,
            youtube,
            twitter,
            instagram,
            linkedin,
            facebook,
        } = req.body;

        const profileFields = {
            user: req.user.id,
            company,
            location,
            bio,
            website: normalizeUrl(website, { forceHttps: true }),
            skills: skills.split(',').map((skill) => skill.trim()),
            status,
            githubusername,
        };

        // Build social object and add to profileFields
        const socialfields = { youtube, twitter, instagram, linkedin, facebook };

        for (const [key, value] of Object.entries(socialfields)) {
            if (value && value.length > 0)
                socialfields[key] = normalizeUrl(value, { forceHttps: true });
        }
        profileFields.social = socialfields;

        try {
            // Using upsert option (creates new doc if no match is found):
            let profile = await Profile.findOneAndUpdate(
                { user: req.user.id },
                { $set: profileFields },
                { new: true, upsert: true }
            );
            res.json(profile);
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error');
        }
    }
);

// @route    GET api/profile
// @desc     Get all profiles
// @access   Public
router.get('/', async (req, res) => {
    try {
        const profiles = await Profile.find().populate('user', ['name', 'avatar']);
        res.json(profiles);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route    GET api/profile/user/user_id
// @desc     Get profile by user id
// @access   Public
router.get('/user/:user_id', async (req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.params.user_id });
        if (!profile) {
            return res.status(400).json({ msg: 'Profile not found' });
        }
        res.status(200).json(profile);
    } catch (err) {
        console.error(err.message);

        res.status(500).send('Server Error');
    }
});

// @route    DELETE api/profile
// @desc     Delete profiel, user , posts
// @access   Private
router.delete('/', auth, async (req, res) => {
    try {
        //removes profile
        await Profile.findOneAndRemove({ user: req.user.id });
        //removes user
        await User.findOneAndRemove({ _id: req.user.id });
        res.json({ msg: 'Deleted' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route    UPDATE api/profile/experience
// @desc     update profile with experience
// @access   Private
router.put('/experience', [
    auth,
    [
        check('title', 'Title is required').not().isEmpty(),
        check('company', 'company is required').not().isEmpty(),
        check('from', 'from is required').not().isEmpty(),
        check('current', 'current is required').not().isEmpty(),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const {
            title,
            company,
            from,
            current,
            location,
            to,
            description,
        } = req.body;

        const newExp = {
            title,
            company,
            from,
            current,
            location,
            to,
            description,
        };
        try {
            const profile = await Profile.findOne({ user: req.user.id });
            profile.experience.push(newExp);
            await profile.save();
            res.json(profile);
        } catch (error) {
            console.error(error.msg);
            res.status(500).send('Server Error');
        }
    },
]);

// @route    DELETE api/profile/experience/:exp_id
// @desc     Delete experience
// @access   Private
router.delete('/experience/:exp_id', auth, async (req, res) => {
    try {
        //removes profile
        let profile = await Profile.findOne({
            user: req.user.id,
        });

        //Get Index

        const removeIndex = profile.experience
            .map((item) => item.id)
            .indexOf(req.params.exp_id);
        profile.experience.splice(removeIndex, 1);
        await profile.save();
        //removes user

        res.json({ profile });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route    UPDATE api/profile/education
// @desc     update profile with education
// @access   Private
router.put(
    '/education',
    [
        auth,
        [
            check('school', 'School is required').not().isEmpty(),
            check('degree', 'degree is required').not().isEmpty(),
            check('fieldofstudy', 'fieldofstudy is required').not().isEmpty(),
            check('from', 'from is required').not().isEmpty(),
            check('current', 'current is required').not().isEmpty(),
        ],
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const {
            school,
            degree,
            fieldofstudy,
            from,
            current,
            to,
            description,
        } = req.body;
        const newEdu = {
            school,
            degree,
            fieldofstudy,
            from,
            current,
            to,
            description,
        };
        try {
            const profile = await Profile.findOne({ user: req.user.id });
            profile.education.push(newEdu);
            await profile.save();
            res.status(200).json(profile);
        } catch (error) {
            console.error(error.message);
            res.status(500).send('Server Error');
        }
    }
);

// @route    DELETE api/profile/education/:edu_id
// @desc     Delete education
// @access   Private
router.delete('/education/:edu_id', auth, async (req, res) => {
    try {
        //removes profile
        let profile = await Profile.findOne({
            user: req.user.id,
        });

        //Get Index

        profile.education = profile.education.filter(
            (item) => item._id.toString() !== req.params.edu_id
        );
        await profile.save();

        /*   const removeIndex = profile.experience
          .map((item) => item.id)
          .indexOf(req.params.exp_id);
        profile.experience.splice(removeIndex, 1);
        await profile.save(); */
        //removes user

        res.json({ profile });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});
// @route    GET api/profile/github/:username
// @desc     Get user repos from github
// @access   Public
router.get('/github/:username', async (req, res) => {
    try {
        const uri = encodeURI(
            `https://api.github.com/users/${req.params.username}/repos?per_page=5&sort=created:asc`
        );
        const headers = {
            'user-agent': 'node.js',
        };
        let gitHubResponse;
        try {
            gitHubResponse = await axios.get(uri, { headers });
        } catch (error) {
            return res.status(400).json({ msg: 'No github user fouund' });
        }

        res.json(gitHubResponse.data);
    } catch (error) {
        console.log(error.message);
        return res.status(500).send('Server error');
    }
});
module.exports = router;
//export default route;
