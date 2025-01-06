const pool = require('../db/db');
const bcrypt = require('bcryptjs');


exports.adminLogin = async (req, res) => {
    const { email, password } = req.body;

 
    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    try {
         const result = await pool.query('SELECT * FROM admin WHERE email = $1', [email]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Admin not found' });
        }
        const admin = result.rows[0];
        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        
        res.status(200).json({ statusCode: 200,message: 'Login successful', admin: { id: admin.adminid, email: admin.email } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};


exports.register=async (req, res) => {
    const { email, password } = req.body;

    try {
        
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

       
        const existingAdmin = await pool.query('SELECT * FROM public.admin WHERE email = $1', [email]);
        if (existingAdmin.rows.length > 0) {
            return res.status(400).json({ error: 'Admin already exists' });
        }

         
        const hashedPassword = await bcrypt.hash(password, 10);

     
        await pool.query(
            'INSERT INTO public.admin (email, password) VALUES ($1, $2)',
            [email, hashedPassword]
        );

        res.status(201).json({ message: 'Admin registered successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
