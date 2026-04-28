import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from '@/components/AppLayout'
import { BrandLoader } from '@/components/BrandLoader'
import { ProtectedRoute, PublicOnlyRoute } from '@/components/ProtectedRoute'

const LoginPage = lazy(() =>
  import('@/pages/LoginPage').then((module) => ({ default: module.LoginPage })),
)
const RegisterPage = lazy(() =>
  import('@/pages/RegisterPage').then((module) => ({
    default: module.RegisterPage,
  })),
)
const DashboardPage = lazy(() =>
  import('@/pages/DashboardPage').then((module) => ({
    default: module.DashboardPage,
  })),
)
const ExpensesPage = lazy(() =>
  import('@/pages/ExpensesPage').then((module) => ({
    default: module.ExpensesPage,
  })),
)
const WeekendExpensesPage = lazy(() =>
  import('@/pages/WeekendExpensesPage').then((module) => ({
    default: module.WeekendExpensesPage,
  })),
)
const RidesPage = lazy(() =>
  import('@/pages/RidesPage').then((module) => ({ default: module.RidesPage })),
)
const FlatViewPage = lazy(() =>
  import('@/pages/FlatViewPage').then((module) => ({
    default: module.FlatViewPage,
  })),
)
const AnnouncementsPage = lazy(() =>
  import('@/pages/AnnouncementsPage').then((module) => ({
    default: module.AnnouncementsPage,
  })),
)
const AdminPage = lazy(() =>
  import('@/pages/AdminPage').then((module) => ({ default: module.AdminPage })),
)
const LogsPage = lazy(() =>
  import('@/pages/LogsPage').then((module) => ({ default: module.LogsPage })),
)
const ContributionsPage = lazy(() =>
  import('@/pages/ContributionsPage').then((module) => ({
    default: module.ContributionsPage,
  })),
)
const CookPage = lazy(() =>
  import('@/pages/CookPage').then((module) => ({
    default: module.CookPage,
  })),
)
const CookMenuPage = lazy(() =>
  import('@/pages/CookMenuPage').then((module) => ({
    default: module.CookMenuPage,
  })),
)
const FlatExpensesPage = lazy(() =>
  import('@/pages/FlatExpensesPage').then((module) => ({
    default: module.FlatExpensesPage,
  })),
)

function App() {
  return (
    <Suspense fallback={<BrandLoader />}>
      <Routes>
        <Route
          path="/login"
          element={
            <PublicOnlyRoute>
              <LoginPage />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicOnlyRoute>
              <RegisterPage />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="expenses" element={<ExpensesPage />} />
          <Route path="weekend-expenses" element={<WeekendExpensesPage />} />
          <Route path="contributions" element={<ContributionsPage />} />
          <Route path="rides" element={<RidesPage />} />
          <Route path="cook" element={<CookPage />} />
          <Route path="daily-menu" element={<CookMenuPage />} />
          <Route path="flat-expenses" element={<FlatExpensesPage />} />
          <Route path="flat-view" element={<FlatViewPage />} />
          <Route path="announcements" element={<AnnouncementsPage />} />
          <Route path="admin" element={<AdminPage />} />
          <Route path="logs" element={<LogsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}

export default App
