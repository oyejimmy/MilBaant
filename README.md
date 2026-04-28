# 💸 MilBaant - Flatmate Expense Manager

A modern, professional web application for managing shared flat expenses efficiently. Built with React, TypeScript, and Supabase, designed with a clean UI and optimized for both mobile and desktop.

## ✨ Features

### Core Expense Management
- 🔐 **Secure Authentication** - Email & password with role-based access
- 💰 **Shared Expenses** - Split monthly bills equally among all members
- 🍽️ **Weekend Meals** - Custom participant expense splitting
- 🚗 **Ride Sharing** - Track shared taxi rides (Yango, InDriver, Careem, Uber)
- 💳 **Contribution Tracking** - Monitor monthly contribution payments with proof

### Collaboration & Organization
- 📊 **Dashboard** - Overview of balances, recent activity, and key metrics
- 🏠 **Flat Layout** - Visual floorplan with bed assignments
- 📢 **Announcements** - Admin-controlled announcement board
- 📝 **Activity Logs** - Complete audit trail of all actions
- 👥 **User Management** - Admin panel for permissions and roles

### User Experience
- 📱 **Mobile-First Design** - Optimized for all screen sizes
- 🌙 **Dark Mode** - Light/dark theme support
- 🎨 **Glassmorphism UI** - Modern, clean interface
- 📤 **Excel Export** - Download expense records
- 🧾 **Bill Upload** - Attach receipt images to expenses

## 🚀 Tech Stack

- **Frontend:** React 19 + TypeScript + Vite
- **UI Library:** Ant Design 6 + Styled Components
- **State Management:** TanStack Query (React Query)
- **Routing:** React Router v7
- **Backend & Database:** Supabase (PostgreSQL + Auth + Storage)
- **File Handling:** SheetJS (xlsx), react-dropzone
- **Visualization:** Konva (flat layout canvas)

## 📁 Project Structure

```
src/
├── components/
│   ├── shared/          # Reusable UI components
│   │   ├── DebtCard.tsx
│   │   ├── ResponsiveDataTable.tsx
│   │   ├── MonthFilter.tsx
│   │   ├── EmptyState.tsx
│   │   └── StatCard.tsx
│   ├── flat-view/       # Flat visualization components
│   ├── AppLayout.tsx    # Main layout with navigation
│   ├── PageHeader.tsx   # Page title component
│   └── ...
├── context/             # React context providers
├── hooks/               # Custom React hooks
├── lib/                 # Utilities and helpers
│   ├── ui-helpers.ts    # UI utility functions
│   ├── constants.ts     # App constants
│   ├── formatters.ts    # Date/currency formatters
│   └── types.ts         # TypeScript types
├── pages/               # Route pages
├── styles/              # Global styles and theme
└── main.tsx             # App entry point

supabase/
├── migrations/          # Database migrations
└── schema.sql           # Complete database schema
```

## ⚙️ Setup & Installation

### Prerequisites
- Node.js 18+ and npm
- Supabase account

### 1. Clone the repository

```bash
git clone https://github.com/your-username/milbaant.git
cd milbaant
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
```

### 4. Setup Database

1. Create a new Supabase project
2. Run the SQL migration in `supabase/schema.sql` in the Supabase SQL editor
3. Ensure Row Level Security (RLS) is enabled on all tables

### 5. Configure Supabase Auth

In your Supabase project settings:
- **Authentication → Email Auth:** Enable email/password authentication
- **Authentication → Email Templates:** Customize confirmation emails (optional)
- **For development:** Disable email confirmation for faster testing

## ▶️ Running the App

### Development

```bash
npm run dev
```

App will be available at `http://localhost:5173`

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## 🔐 User Roles & Permissions

### Admin
- Full system access
- Manage users and permissions
- Control announcements
- Manage bed assignments
- Delete any expense
- Modify member count settings

### User
- View all data
- Add expenses (if permitted by admin)
- Submit contribution payments
- View personal balances
- Cannot edit or delete expenses

## 🎯 How It Works

### Expense Splitting

**Fixed Expenses (Gas, Light, Cook Salary, etc.)**
- Split equally among all members
- Member count set by admin
- Automatic per-person calculation

**Weekend Meals**
- Split only among selected participants
- Custom participant selection
- Tracks who owes whom

**Rides**
- One person pays the fare
- Split among all riders
- Automatic debt calculation

### Contribution Tracking
- Members submit monthly contribution payments
- Upload payment proof (screenshot)
- Admin tracks who paid and who's overdue
- Total collected amount displayed

### Debt Settlement
- System calculates net debts
- "Who owes whom" cards
- Manual settlement recording
- Settlement history tracking

## 📱 Mobile Optimization

- **Touch-friendly:** Minimum 32px touch targets
- **Responsive tables:** Auto-switch to card view on mobile
- **Bottom navigation:** Easy thumb access on mobile
- **Optimized forms:** Full-width inputs on small screens
- **Safe areas:** Support for notched devices
- **Smooth animations:** 60fps on all devices

## 🎨 Design System

### Colors
- **Primary:** Periwinkle Blue (#909ffa)
- **Success:** Green (#52c41a)
- **Error:** Red (#ff4d4f)
- **Warning:** Orange (#fa8c16)

### Typography
- **Font:** Plus Jakarta Sans
- **Headings:** 700 weight
- **Body:** 400-600 weight
- **Responsive:** clamp() for fluid scaling

### Spacing
- **Base unit:** 4px
- **Common gaps:** 8px, 12px, 16px, 20px, 24px
- **Card padding:** 12-14px (mobile), 18-20px (desktop)

## 🧪 Testing

```bash
# Run linter
npm run lint

# Type check
npm run build
```

## 📊 Database Schema

### Core Tables
- `profiles` - User accounts with roles
- `expenses` - All expense records
- `expense_participants` - Custom participant splits
- `debt_settlements` - Payment records between members
- `announcements` - Admin posts

### Specialized Tables
- `rooms` & `beds` - Flat layout structure
- `bed_assignments` - User-to-bed mapping
- `rides` & `ride_riders` - Shared taxi tracking
- `contribution_payments` - Monthly contribution proof
- `activity_logs` - Audit trail
- `settings` - Key-value configuration

## 🔒 Security

- **Row Level Security (RLS)** enabled on all tables
- **Authentication required** for all operations
- **Role-based access control** for admin features
- **Secure file storage** for bill images
- **SQL injection protection** via Supabase client
- **XSS protection** via React's built-in escaping

## 🚧 Roadmap

### Phase 1 (Current)
- ✅ Core expense management
- ✅ Mobile-responsive design
- ✅ Reusable component library
- ✅ Simplified navigation

### Phase 2 (Next)
- [ ] Expense categories with icons
- [ ] Search and advanced filtering
- [ ] Charts and analytics
- [ ] Notifications system
- [ ] Bulk operations

### Phase 3 (Future)
- [ ] Recurring expenses
- [ ] Multiple currencies
- [ ] Payment gateway integration
- [ ] Native mobile app
- [ ] Offline support

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👨‍💻 Author

**Jamil Ur Rahman**  
Frontend Developer | React & TypeScript Specialist

## 🙏 Acknowledgments

- Ant Design team for the excellent UI library
- Supabase team for the amazing backend platform
- React team for the powerful framework

## ⭐ Support

If you find this project helpful, please give it a ⭐ on GitHub!

---

**Built with ❤️ for flatmates who want to split expenses fairly and transparently.**