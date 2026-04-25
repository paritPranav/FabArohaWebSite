// apps/server/src/scripts/createAdmin.js
const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '../.env') })
console.log('MONGO URI:', process.env.MONGODB_URI) 
const mongoose = require('mongoose')
const User = require('./models/User')

async function createAdmin() {
  console.log(process.env.MONGODB_URI)
  await mongoose.connect(process.env.MONGODB_URI)

  const existing = await User.findOne({ phone: '9999999999' })
  if (existing) {
    console.log('Admin already exists')
    process.exit(0)
  }

  const admin = await User.create({
    name:     'Fab Aroha Admin',
    phone:    '9999999999',
    email:    'admin@fabaroha.in',
    password: 'Admin@123',       // pre-save hook will hash this automatically
    role:     'admin',
  })

  console.log('✅ Admin created:', admin.phone)
  process.exit(0)
}

createAdmin().catch(err => { console.error(err); process.exit(1) })