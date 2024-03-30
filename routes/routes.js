const express = require('express');
const router = express.Router();
const User = require('../models/users');
const multer = require('multer');
const users = require('../models/users');
const fs = require('fs');

// Configure multer for file upload
const storage = multer.diskStorage({
    destination: function(req, file, cb){
        cb(null, './uploads');
    },
    filename: function(req, file, cb){
        cb(null, file.fieldname + "_" + Date.now() + "_" + file.originalname);
    },
});

const upload = multer({
    storage: storage,
}).single('image');

// Add a new user to the database
router.post('/add', upload, async (req, res) => {
    try {
        // Handle file upload
        if (!req.file) {
            return res.status(400).json({ message: 'Please upload an image', type: 'danger' });
        }

        // Create a new user instance
        const user = new User({
            name: req.body.name,
            email: req.body.email,
            phone: req.body.phone,
            notes: req.body.notes,
            total: req.body.total, 
            image: req.file.filename,
        });

        // Save the user to the database
        await user.save();

        req.session.message = {
            type: 'success',
            message: 'User added successfully',
        };
        res.redirect('/');
    } catch (err) {
        res.status(400).json({ message: err.message, type: 'danger' });
    }
});

// Render the home page
router.get('/', (req, res) => {
    User.find().exec()
        .then(users => {
            res.render('index', {
                title: 'Home Page',
                users: users
            });
        })
        .catch(err => {
            res.json({ message: err.message });
        });
});



// Render the page to add users
router.get('/add', (req, res) => {
    res.render('add_users', { title: "Add Users" });
});

// Edit
router.get('/edit/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const user = await User.findById(id).exec();
        if (!user) {
            return res.redirect('/');
        }
        res.render('edit_users', {
            title: 'Edit User',
            user: user,
        });
    } catch (err) {
        console.error(err);
        res.redirect('/');
    }
});

// Update
router.post('/update/:id', upload, async (req, res) => {
    try {
        const id = req.params.id;
        let newImage = '';

        // Check if there is a new image uploaded
        if (req.file) {
            newImage = req.file.filename;
            // Delete old image
            await fs.unlink(`./uploads/${req.body.old_image}`);
        } else {
            newImage = req.body.old_image;
        }

        // Update user data
        await User.findByIdAndUpdate(id, {
            name: req.body.name,
            email: req.body.email,
            phone: req.body.phone,
            notes: req.body.notes,
            total: req.body.total,
            image: newImage,
        });

        req.session.message = {
            type: 'success',
            message: 'User updated successfully'
        };
        res.redirect("/");
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal server error', type: 'danger' });
    }
});

// Delete
// Delete
router.get('/delete/:id', async (req, res) => {
    try {
        const id = req.params.id;
        // Temukan pengguna berdasarkan ID dan hapus dari database
        const result = await User.findByIdAndDelete(id);
        
        // Periksa apakah pengguna memiliki gambar terkait dan hapus jika ada
        if (result && result.image !== '') {
            const imagePath = './uploads/' + result.image;
            // Periksa keberadaan file sebelum mencoba menghapusnya
            if (fs.existsSync(imagePath)) {
                // Hapus gambar dari direktori uploads
                fs.unlinkSync(imagePath);
                console.log("File deleted successfully:", imagePath); // Tampilkan pesan jika file berhasil dihapus
            } else {
                console.log("File not found:", imagePath);
            }
        }
        
        req.session.message = {
            type: 'info',
            message: 'User deleted successfully'
        };
        res.redirect('/');
    } catch (err) {
        console.error("Error deleting user:", err);
        res.status(500).json({ message: 'Internal server error', type: 'danger' });
    }
});

module.exports = router;
