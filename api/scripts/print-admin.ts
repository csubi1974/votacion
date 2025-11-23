#!/usr/bin/env node

import { sequelize } from '../config/database.js'
import { User } from '../models/User.js'

async function main() {
  try {
    await sequelize.authenticate()
    const admin = await User.findOne({ where: { role: 'super_admin' } })
    if (!admin) {
      console.log('NO_ADMIN')
    } else {
      console.log(JSON.stringify({ rut: admin.rut, email: admin.email }, null, 2))
    }
  } catch (e) {
    console.error('ERROR', e)
    process.exit(1)
  } finally {
    await sequelize.close()
    process.exit(0)
  }
}

main()