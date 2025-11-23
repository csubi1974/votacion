
import { sequelize } from '../config/database.js'
import { User } from '../models/User.js'
import { hashPassword } from '../utils/security.js'

async function main() {
  try {
    await sequelize.authenticate()
    const rut = '1.385.329-0'
    const password = 'Admin123!'
    
    const user = await User.findOne({ where: { rut } })
    if (!user) {
      console.error('User not found')
      process.exit(1)
    }

    user.passwordHash = await hashPassword(password)
    await user.save()
    
    console.log(`Password for ${rut} reset to ${password}`)
  } catch (e) {
    console.error('ERROR', e)
    process.exit(1)
  } finally {
    await sequelize.close()
    process.exit(0)
  }
}

main()
