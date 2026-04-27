import { lazy, Suspense } from 'react'
import { Flex } from 'antd'
import { LoadingOutlined } from '@ant-design/icons'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from '@/components/AppLayout'
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
const WeekendExpensesPage = lazy(() =>
  import('@/pages/WeekendExpensesPage').then((module) => ({
    default: module.WeekendExpensesPage,
  })),
)
const RidesPage = lazy(() =>
  import('@/pages/RidesPage').then((module) => ({ default: module.RidesPage })),
)
const CookPage = lazy(() =>
  import('@/pages/CookPage').then((module) => ({ default: module.CookPage })),
)
const LogsPage = lazy(() =>
  import('@/pages/LogsPage').then((module) => ({ default: module.LogsPage })),
)

function RouteLoader() {
  return (
    <Flex align="center" justify="center" style={{ minHeight: '60vh' }}>
      <LoadingOutlined style={{ fontSize: 36, color: '#909ffa' }} spin />
    </Flex>
  )
}

function App() {
  return (
    <Suspense fallback={<RouteLoader />}>
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
          <Route path="rides" element={<RidesPage />} />
          <Route path="cook" element={<CookPage />} />
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
