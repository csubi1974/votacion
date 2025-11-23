#!/usr/bin/env node

import { sequelize } from '../config/database.js'
import { Organization } from '../models/Organization.js'
import { User } from '../models/User.js'
import { hashPassword } from '../utils/security.js'
import { generateRandomRut } from '../utils/rutValidator.js'

async function main() {
  try {
    await sequelize.authenticate()
    const org = await Organization.findOne()
    if (!org) {
      console.error('NO_ORG')
      process.exit(1)
    }
    const existingAdmin = await User.findOne({ where: { role: 'super_admin' } })
    if (existingAdmin) {
      console.log(JSON.stringify({ rut: existingAdmin.rut, email: existingAdmin.email }, null, 2))
      return
    }
    const email = 'admin@voting-platform.com'
    const password = 'Admin123!'
    const rut = generateRandomRut()
    const user = await User.create({
      rut,
      email,
      passwordHash: await hashPassword(password),
      fullName: 'System Administrator',
      role: 'super_admin',
      organizationId: org.getDataValue('id'),
      emailVerified: true,
    })
    console.log(JSON.stringify({ rut: user.rut, email: user.email, password }, null, 2))
  } catch (e) {
    console.error('ERROR', e)
    process.exit(1)
  } finally {
    await sequelize.close()
    process.exit(0)
  }
}

main()