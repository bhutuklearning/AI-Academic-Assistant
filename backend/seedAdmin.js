import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from './src/models/User.js';

dotenv.config();

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const email = 'avoy123@gmail.com';
    const password = 'avoy123@gmail.com';

    let admin = await User.findOne({ email });

    if (!admin) {
      console.log('Admin user not found, creating a new one...');
      const hashedPassword = await bcrypt.hash(password, 10);
      admin = new User({
        email,
        password: hashedPassword,
        name: 'Avoy Admin',
        university: 'Admin University',
        college: 'Admin College',
        branch: 'System Administration',
        semester: 8,
        role: 'admin',
        status: 'active'
      });
      await admin.save();
      console.log('Admin user created successfully!');
    } else {
      console.log('Admin user already exists, ensuring role is set to admin and updating password...');
      const hashedPassword = await bcrypt.hash(password, 10);
      admin.password = hashedPassword;
      admin.role = 'admin';
      admin.status = 'active';
      await admin.save();
      console.log('Admin user updated successfully!');
    }

  } catch (error) {
    console.error('Error seeding admin user:', error);
  } finally {
    mongoose.connection.close();
    process.exit(0);
  }
};

seedAdmin();
