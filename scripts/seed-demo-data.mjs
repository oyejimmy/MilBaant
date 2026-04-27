import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')

loadEnvFile(path.join(projectRoot, '.env'))
loadEnvFile(path.join(projectRoot, '.env.local'))

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const demoPassword = process.env.DEMO_USER_PASSWORD || 'Flatmate123!'

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    'Missing Supabase config. Add VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to .env before seeding demo data.',
  )
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
})

const demoUsers = [
  { email: 'admin@milbaant.demo', fullName: 'Ahsan Admin', role: 'admin', canAddExpenses: true },
  { email: 'ali@milbaant.demo', fullName: 'Ali Raza', role: 'user', canAddExpenses: true },
  { email: 'usman@milbaant.demo', fullName: 'Usman Tariq', role: 'user', canAddExpenses: true },
  { email: 'hamza@milbaant.demo', fullName: 'Hamza Shah', role: 'user', canAddExpenses: false },
  { email: 'bilal@milbaant.demo', fullName: 'Bilal Ahmed', role: 'user', canAddExpenses: false },
  { email: 'danish@milbaant.demo', fullName: 'Danish Khan', role: 'user', canAddExpenses: false },
  { email: 'farhan@milbaant.demo', fullName: 'Farhan Siddiqui', role: 'user', canAddExpenses: false },
  { email: 'hasnain@milbaant.demo', fullName: 'Hasnain Iqbal', role: 'user', canAddExpenses: false },
  { email: 'jawad@milbaant.demo', fullName: 'Jawad Malik', role: 'user', canAddExpenses: false },
  { email: 'kamran@milbaant.demo', fullName: 'Kamran Yousaf', role: 'user', canAddExpenses: false },
]

const sharedRooms = [
  { name: 'Room 1', type: 'bedroom' },
  { name: 'Room 2', type: 'bedroom' },
  { name: 'Room 3', type: 'bedroom' },
  { name: 'Room 1 Washroom', type: 'washroom' },
  { name: 'Room 2 Washroom', type: 'washroom' },
  { name: 'Room 3 Washroom', type: 'washroom' },
  { name: 'Kitchen', type: 'kitchen' },
  { name: 'TV Lounge', type: 'lounge' },
  { name: 'Dining', type: 'dining' },
]

main().catch((error) => {
  console.error('Demo seed failed.')
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})

async function main() {
  await verifySchema()

  const existingUsers = await listAllUsers()
  const userIdsByEmail = new Map(existingUsers.map((user) => [user.email, user.id]))
  const createdUsers = []

  for (const demoUser of demoUsers) {
    let userId = userIdsByEmail.get(demoUser.email)

    if (!userId) {
      const { data, error } = await supabase.auth.admin.createUser({
        email: demoUser.email,
        password: demoPassword,
        email_confirm: true,
        user_metadata: {
          full_name: demoUser.fullName,
        },
      })

      if (error) {
        throw new Error(`Unable to create demo user ${demoUser.email}: ${error.message}`)
      }

      userId = data.user.id
      userIdsByEmail.set(demoUser.email, userId)
    }

    createdUsers.push({
      ...demoUser,
      id: userId,
    })
  }

  await upsertProfiles(createdUsers)
  await ensureRoomsAndBeds()
  await assignBeds(createdUsers)
  await seedSettings()
  await seedAnnouncements(createdUsers[0].id)
  await seedExpenses(createdUsers)

  console.log('Demo data seeded successfully.')
  console.log('')
  console.log('Demo credentials')
  console.log(`Password for all demo users: ${demoPassword}`)

  for (const user of createdUsers) {
    console.log(`- ${user.email} (${user.fullName}) | role=${user.role} | can_add_expenses=${user.canAddExpenses}`)
  }
}

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return
  }

  const fileContents = fs.readFileSync(filePath, 'utf8')

  for (const line of fileContents.split(/\r?\n/)) {
    const trimmed = line.trim()

    if (!trimmed || trimmed.startsWith('#')) {
      continue
    }

    const separatorIndex = trimmed.indexOf('=')

    if (separatorIndex === -1) {
      continue
    }

    const key = trimmed.slice(0, separatorIndex).trim()
    const rawValue = trimmed.slice(separatorIndex + 1).trim()
    const value = rawValue.replace(/^['"]|['"]$/g, '')

    if (!process.env[key]) {
      process.env[key] = value
    }
  }
}

async function listAllUsers() {
  const users = []
  let page = 1

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: 200,
    })

    if (error) {
      throw new Error(`Unable to list Supabase users: ${error.message}`)
    }

    users.push(...data.users)

    if (data.users.length < 200) {
      break
    }

    page += 1
  }

  return users
}

async function verifySchema() {
  const { error } = await supabase.from('profiles').select('id').limit(1)

  if (error) {
    throw new Error(
      `Supabase schema is not ready. Run supabase/migrations/202604271230_init.sql first. Details: ${error.message}`,
    )
  }
}

async function upsertProfiles(users) {
  const { error } = await supabase.from('profiles').upsert(
    users.map((user) => ({
      id: user.id,
      full_name: user.fullName,
      role: user.role,
      can_add_expenses: user.canAddExpenses,
    })),
    { onConflict: 'id' },
  )

  if (error) {
    throw new Error(`Unable to upsert profiles: ${error.message}`)
  }
}

async function ensureRoomsAndBeds() {
  const { data: existingRooms, error: roomError } = await supabase
    .from('rooms')
    .select('id, name, type')

  if (roomError) {
    throw new Error(`Unable to read rooms: ${roomError.message}`)
  }

  const existingRoomNames = new Set((existingRooms ?? []).map((room) => room.name))
  const missingRooms = sharedRooms.filter((room) => !existingRoomNames.has(room.name))

  if (missingRooms.length) {
    const { error } = await supabase.from('rooms').insert(missingRooms)

    if (error) {
      throw new Error(`Unable to insert rooms: ${error.message}`)
    }
  }

  const { data: rooms, error: refreshedRoomError } = await supabase
    .from('rooms')
    .select('id, name')
    .order('id', { ascending: true })

  if (refreshedRoomError) {
    throw new Error(`Unable to reload rooms: ${refreshedRoomError.message}`)
  }

  const bedroomRooms = (rooms ?? []).filter((room) => /^Room [1-3]$/.test(room.name))

  const { data: existingBeds, error: bedError } = await supabase
    .from('beds')
    .select('id, room_id, label')

  if (bedError) {
    throw new Error(`Unable to read beds: ${bedError.message}`)
  }

  const existingBedKeys = new Set(
    (existingBeds ?? []).map((bed) => `${bed.room_id}:${bed.label}`),
  )

  const missingBeds = []

  for (const room of bedroomRooms) {
    for (const label of ['Bed A', 'Bed B']) {
      const key = `${room.id}:${label}`

      if (!existingBedKeys.has(key)) {
        missingBeds.push({
          room_id: room.id,
          label,
        })
      }
    }
  }

  if (missingBeds.length) {
    const { error } = await supabase.from('beds').insert(missingBeds)

    if (error) {
      throw new Error(`Unable to insert beds: ${error.message}`)
    }
  }
}

async function assignBeds(users) {
  const { data: rooms, error: roomsError } = await supabase
    .from('rooms')
    .select('id, name')

  if (roomsError) {
    throw new Error(`Unable to load rooms for bed assignment: ${roomsError.message}`)
  }

  const roomOrder = new Map([
    ['Room 1', 1],
    ['Room 2', 2],
    ['Room 3', 3],
  ])

  const roomNameById = new Map((rooms ?? []).map((room) => [room.id, room.name]))

  const { data: beds, error: bedsError } = await supabase
    .from('beds')
    .select('id, room_id, label')

  if (bedsError) {
    throw new Error(`Unable to load beds for assignment: ${bedsError.message}`)
  }

  const bedroomBeds = (beds ?? [])
    .filter((bed) => roomOrder.has(roomNameById.get(bed.room_id)))
    .sort((left, right) => {
      const leftRoomOrder = roomOrder.get(roomNameById.get(left.room_id)) ?? 99
      const rightRoomOrder = roomOrder.get(roomNameById.get(right.room_id)) ?? 99

      if (leftRoomOrder !== rightRoomOrder) {
        return leftRoomOrder - rightRoomOrder
      }

      return left.label.localeCompare(right.label)
    })
    .slice(0, 6)

  const selectedUserIds = users.slice(0, 6).map((user) => user.id)
  const selectedBedIds = bedroomBeds.map((bed) => bed.id)

  const { error: removeByUserError } = await supabase
    .from('bed_assignments')
    .delete()
    .in('user_id', selectedUserIds)

  if (removeByUserError) {
    throw new Error(`Unable to clear existing bed assignments by user: ${removeByUserError.message}`)
  }

  const { error: removeByBedError } = await supabase
    .from('bed_assignments')
    .delete()
    .in('bed_id', selectedBedIds)

  if (removeByBedError) {
    throw new Error(`Unable to clear existing bed assignments by bed: ${removeByBedError.message}`)
  }

  const assignments = bedroomBeds.map((bed, index) => ({
    bed_id: bed.id,
    user_id: users[index].id,
  }))

  const { error: insertError } = await supabase
    .from('bed_assignments')
    .insert(assignments)

  if (insertError) {
    throw new Error(`Unable to insert bed assignments: ${insertError.message}`)
  }
}

async function seedSettings() {
  const { error } = await supabase.from('settings').upsert({
    key: 'member_count',
    value: '10',
  })

  if (error) {
    throw new Error(`Unable to seed settings: ${error.message}`)
  }
}

async function seedAnnouncements(adminUserId) {
  const { error: deleteError } = await supabase
    .from('announcements')
    .delete()
    .like('title', 'DEMO - %')

  if (deleteError) {
    throw new Error(`Unable to clear demo announcements: ${deleteError.message}`)
  }

  const { error: insertError } = await supabase.from('announcements').insert([
    {
      title: 'DEMO - Monthly flat meeting',
      content:
        'Please review the current month summary before Friday night so we can close balances on time.',
      created_by: adminUserId,
    },
    {
      title: 'DEMO - Weekend meal planning',
      content:
        'If you will be away on Saturday or Sunday, make sure the weekend meal participants are updated when expenses are added.',
      created_by: adminUserId,
    },
  ])

  if (insertError) {
    throw new Error(`Unable to insert demo announcements: ${insertError.message}`)
  }
}

async function seedExpenses(users) {
  const expenseManagers = [users[0], users[1], users[2]]

  const { error: deleteError } = await supabase
    .from('expenses')
    .delete()
    .like('description', 'DEMO - %')

  if (deleteError) {
    throw new Error(`Unable to clear demo expenses: ${deleteError.message}`)
  }

  const today = new Date()
  const year = today.getUTCFullYear()
  const month = today.getUTCMonth()
  const firstDayOfMonth = toIsoDate(new Date(Date.UTC(year, month, 1)))
  const secondDayOfMonth = toIsoDate(new Date(Date.UTC(year, month, 2)))
  const thirdDayOfMonth = toIsoDate(new Date(Date.UTC(year, month, 3)))
  const weekendDates = getFirstWeekendDates(year, month)

  const fixedExpenses = [
    {
      created_by: expenseManagers[0].id,
      category: 'gas_bill',
      description: 'DEMO - Monthly gas bill',
      amount: 6400,
      date: firstDayOfMonth,
      split_type: 'all_members',
      bill_image_url: null,
    },
    {
      created_by: expenseManagers[1].id,
      category: 'light_bill',
      description: 'DEMO - Electricity bill',
      amount: 18500,
      date: firstDayOfMonth,
      split_type: 'all_members',
      bill_image_url: null,
    },
    {
      created_by: expenseManagers[2].id,
      category: 'cook_salary',
      description: 'DEMO - Cook salary',
      amount: 22000,
      date: secondDayOfMonth,
      split_type: 'all_members',
      bill_image_url: null,
    },
    {
      created_by: expenseManagers[0].id,
      category: 'kitchen_daily',
      description: 'DEMO - Kitchen daily restock',
      amount: 9800,
      date: secondDayOfMonth,
      split_type: 'all_members',
      bill_image_url: null,
    },
    {
      created_by: expenseManagers[1].id,
      category: 'water_roti',
      description: 'DEMO - Water and roti charges',
      amount: 5400,
      date: secondDayOfMonth,
      split_type: 'all_members',
      bill_image_url: null,
    },
    {
      created_by: expenseManagers[2].id,
      category: 'meat',
      description: 'DEMO - Meat order',
      amount: 11250,
      date: thirdDayOfMonth,
      split_type: 'all_members',
      bill_image_url: null,
    },
    {
      created_by: expenseManagers[0].id,
      category: 'maintenance',
      description: 'DEMO - General maintenance',
      amount: 4300,
      date: thirdDayOfMonth,
      split_type: 'all_members',
      bill_image_url: null,
    },
    {
      created_by: expenseManagers[1].id,
      category: 'pcc_grocery',
      description: 'DEMO - PCC grocery run',
      amount: 7600,
      date: thirdDayOfMonth,
      split_type: 'all_members',
      bill_image_url: null,
    },
  ]

  const weekendExpenses = [
    {
      created_by: users[0].id,
      category: 'weekend_meal',
      description: 'DEMO - Saturday breakfast and chai',
      amount: 1850,
      date: weekendDates.saturday,
      split_type: 'custom_participants',
      bill_image_url: null,
      participantIds: users.slice(0, 8).map((user) => user.id),
    },
    {
      created_by: users[1].id,
      category: 'weekend_meal',
      description: 'DEMO - Saturday dinner groceries',
      amount: 4200,
      date: weekendDates.saturday,
      split_type: 'custom_participants',
      bill_image_url: null,
      participantIds: users.slice(0, 6).map((user) => user.id),
    },
    {
      created_by: users[2].id,
      category: 'weekend_meal',
      description: 'DEMO - Sunday lunch ingredients',
      amount: 3650,
      date: weekendDates.sunday,
      split_type: 'custom_participants',
      bill_image_url: null,
      participantIds: users.slice(2, 10).map((user) => user.id),
    },
  ]

  const allExpenses = [...fixedExpenses, ...weekendExpenses]

  const { data: insertedExpenses, error: insertError } = await supabase
    .from('expenses')
    .insert(allExpenses.map(({ participantIds, ...expense }) => expense))
    .select('id, description')

  if (insertError) {
    throw new Error(`Unable to insert demo expenses: ${insertError.message}`)
  }

  const expenseIdByDescription = new Map(
    (insertedExpenses ?? []).map((expense) => [expense.description, expense.id]),
  )

  const participantRows = weekendExpenses.flatMap((expense) => {
    const expenseId = expenseIdByDescription.get(expense.description)

    if (!expenseId) {
      return []
    }

    return expense.participantIds.map((userId) => ({
      expense_id: expenseId,
      user_id: userId,
    }))
  })

  const { error: participantInsertError } = await supabase
    .from('expense_participants')
    .insert(participantRows)

  if (participantInsertError) {
    throw new Error(`Unable to insert weekend participants: ${participantInsertError.message}`)
  }
}

function getFirstWeekendDates(year, month) {
  let saturday = null
  let sunday = null

  for (let day = 1; day <= 14; day += 1) {
    const date = new Date(Date.UTC(year, month, day))
    const weekday = date.getUTCDay()

    if (weekday === 6 && !saturday) {
      saturday = toIsoDate(date)
    }

    if (weekday === 0 && !sunday) {
      sunday = toIsoDate(date)
    }

    if (saturday && sunday) {
      break
    }
  }

  if (!saturday || !sunday) {
    throw new Error('Unable to determine weekend dates for demo expenses.')
  }

  return { saturday, sunday }
}

function toIsoDate(date) {
  return date.toISOString().slice(0, 10)
}
