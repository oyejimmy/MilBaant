# 💸 Flat Expenses Manager

A modern web application for managing shared flat expenses efficiently. Built with a powerful stack and designed with a clean, professional UI, this app simplifies expense tracking, splitting, and collaboration among flatmates.


## 🚀 Features

- 🔐 Secure authentication (Email & Password)
- 👥 Role-based access (`Admin` & `User`)
- ✅ Permission control for adding expenses
- 💰 Monthly fixed expense splitting
- 🍽️ Weekend expense sharing with custom participants
- 📊 Per-user monthly summaries
- 🧾 Bill image upload support
- 🛏️ Flat layout with bed assignment management
- 📢 Announcement board (Admin controlled)
- 📤 Excel export for records
- 🎨 Glassmorphism UI with responsive design
- 🌙 Light/Dark mode ready

---

## 🧰 Tech Stack

- **Frontend:** React + TypeScript + Vite  
- **UI:** Ant Design + Styled Components  
- **State Management:** TanStack Query  
- **Routing:** React Router  
- **Backend & DB:** Supabase  
- **File Handling:** SheetJS (xlsx), react-dropzone  

---

## 📁 Project Structure

```
src/
├── components/
├── context/
├── hooks/
├── lib/
├── pages/
└── styles/

supabase/
└── migrations/
```

## ⚙️ Setup & Installation

### 1. Clone the repository

```bash
git clone https://github.com/your-username/flat-expenses-manager.git
cd flat-expenses-manager
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file and add:

```env
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
```

### 4. Setup Database

Run the SQL migration files located in:

```
supabase/migrations/
```

## ▶️ Running the App

```bash
npm run dev
```

App will be available at:

```
http://localhost:5173
```

## 🏗️ Build for Production

```bash
npm run build
```

To preview:

```bash
npm run preview
```

## 🔐 Authentication & Roles

### Admin

- Full access to the system
- Manage users & permissions
- Control announcements
- Manage bed assignments
- Delete any expense

### User

- View all data
- Add expenses (if permitted)
- Cannot edit or delete expenses

## 🧠 How It Works

- **Fixed Expenses:** Split equally among all members
- **Weekend Expenses:** Split only among selected participants
- **Permissions:** Controlled per user by admin
- **Storage:** Bills and images are securely stored

## 🎨 UI & Design

- Clean Glassmorphism-inspired interface
- Built with Ant Design + Styled Components
- Fully responsive layout
- Smooth transitions and interactions

## 📌 Future Improvements

- Notifications system 🔔
- Mobile app (React Native) 📱
- Advanced analytics dashboard 📊
- Real-time updates ⚡

## 🤝 Contributing

Contributions are welcome!

1. Fork the repository
2. Create a new branch
3. Make your changes
4. Submit a pull request

## 👨‍💻 Author

**Jamil Ur Rahman**  
Frontend Developer | React & TypeScript Specialist

## ⭐ Support

If you like this project, give it a ⭐ on GitHub — it helps a lot!