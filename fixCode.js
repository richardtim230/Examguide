import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

// Minimal models for migration
const FacultySchema = new mongoose.Schema({ name: String });
const DepartmentSchema = new mongoose.Schema({ name: String, faculty: mongoose.Schema.Types.Mixed });
const UserSchema = new mongoose.Schema({ faculty: mongoose.Schema.Types.Mixed, department: mongoose.Schema.Types.Mixed });

const Faculty = mongoose.model('Faculty', FacultySchema, 'faculties');
const Department = mongoose.model('Department', DepartmentSchema, 'departments');
const User = mongoose.model('User', UserSchema, 'users');

async function fixUsersFacultyRefs() {
  const users = await User.find({ faculty: { $type: 'string' } });
  for (const user of users) {
    const fac = await Faculty.findOne({ name: user.faculty });
    if (fac) {
      user.faculty = fac._id;
      await user.save();
      console.log(`Updated user ${user._id} faculty to ObjectId ${fac._id}`);
    }
  }
}
async function fixUsersDepartmentRefs() {
  const users = await User.find({ department: { $type: 'string' } });
  for (const user of users) {
    const dept = await Department.findOne({ name: user.department });
    if (dept) {
      user.department = dept._id;
      await user.save();
      console.log(`Updated user ${user._id} department to ObjectId ${dept._id}`);
    }
  }
}
async function fixDepartmentsFacultyRefs() {
  const departments = await Department.find({ faculty: { $type: 'string' } });
  for (const dept of departments) {
    const fac = await Faculty.findOne({ name: dept.faculty });
    if (fac) {
      dept.faculty = fac._id;
      await dept.save();
      console.log(`Updated department ${dept._id} faculty to ObjectId ${fac._id}`);
    }
  }
}

async function main() {
  await mongoose.connect(MONGODB_URI);
  await fixUsersFacultyRefs();
  await fixUsersDepartmentRefs();
  await fixDepartmentsFacultyRefs();
  await mongoose.disconnect();
  console.log('Done!');
}

main().catch(err => {
  console.error('Migration error:', err);
  process.exit(1);
});
