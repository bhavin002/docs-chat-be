const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const nodemailer = require('nodemailer');
const Joi = require("joi");
const { welcome } = require('../templates/welcome');

const registerUserValidation = Joi.object({
    name: Joi.string().required(),
    email: Joi.string().email().required(),
    password: Joi.string()
        .min(8) // Minimum length of 8 characters
        .pattern(/(?=.*[a-z])/, 'lowercase') // At least one lowercase letter
        .pattern(/(?=.*[A-Z])/, 'uppercase') // At least one uppercase letter
        .pattern(/(?=.*[0-9])/, 'digit') // At least one numeric digit
        .pattern(/(?=.*[\W_])/, 'special') // At least one special character (non-word character)
        .required(),
});

const loginUserValidation = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
});

// User Registration

exports.register = async (req, res) => {
    const { error } = registerUserValidation.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const { name, email, password } = req.body;
    console.log('✌️name --->', name, email, password);

    try {
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        console.log('✌️hashedPassword --->', hashedPassword);
        user = new User({ name, email, password: hashedPassword });
        console.log('✌️user --->', user);
        await user.save();

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL,
                pass: process.env.EMAIL_PASSWORD,
            },
        });

        const mailOptions = {
            from: process.env.EMAIL,
            to: user.email,
            subject: 'Welcome to our platform',
            html: welcome(name),
        };

        transporter.sendMail(mailOptions, (err, info) => {
            if (err) console.log(err);
            else console.log(`Email sent: ${info.response}`);
        });
        res.status(201).json({ message: 'registered successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};

// User Login

exports.login = async (req, res) => {
    const { error } = loginUserValidation.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: 'Invalid credentials' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '8h' });
        res.json({ token });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};
