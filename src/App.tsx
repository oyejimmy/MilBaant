import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from '@/components/AppLayout'
import { BrandLoader } from '@/components/BrandLoader'
import { ProtectedRoute, PublicOnlyRoute } from '@/components/ProtectedRoute'
import { CookLayout } from '@/components/CookLayout'
import { CookRoute } from '@/components/CookRoute'
import { NotFoundPage } from '@/pages/NotFoundPage'

/**
 * FadingLoader — wraps BrandLoader so it fades out smoothly instead of
 * blinking off when the lazy chunk finishes loading.
 */
function FadingLoader() {
  const [hiding, setHiding] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      // When Suspense unmounts this component (chunk loaded), trigger fade-out
      setHiding(true)
      timerRef.current = setTimeout(() => {
        // nothing — component is already unmounted by React
      }, 400)
    }
  }, [])

  return <BrandLoader hiding={hiding} />
}

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
const AnnouncementsPage = lazy(() =>
  import('@/pages/AnnouncementsPage').then((module) => ({
    default: module.AnnouncementsPage,
  })),
)
const CookDashboardPage = lazy(() =>
  import('@/pages/CookDashboardPage').then((module) => ({
    default: module.CookDashboardPage,
  })),
)
const CookRequestsPage = lazy(() =>
  import('@/pages/CookRequestsPage').then((module) => ({
    default: module.CookRequestsPage,
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
const ProfilePage = lazy(() =>
  import('@/pages/ProfilePage').then((module) => ({
    default: module.ProfilePage,
  })),
)
const ForgotPasswordPage = lazy(() =>
  import('@/pages/ForgotPasswordPage').then((module) => ({
    default: module.ForgotPasswordPage,
  })),
)
const ResetPasswordPage = lazy(() =>
  import('@/pages/ResetPasswordPage').then((module) => ({
    default: module.ResetPasswordPage,
  })),
)
const PendingApprovalPage = lazy(() =>
  import('@/pages/PendingApprovalPage').then((module) => ({
    default: module.PendingApprovalPage,
  })),
)
function App() {
  return (
    <Suspense fallback={<FadingLoader />}>
      <Routes>
        {/* ── Public routes ── */}
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
          path="/forgot-password"
          element={
            <PublicOnlyRoute>
              <ForgotPasswordPage />
            </PublicOnlyRoute>
          }
        />
        {/* /reset-password must NOT be PublicOnlyRoute — the user arrives here
            with a temporary recovery session, so they'd be redirected away */}
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/pending" element={<PendingApprovalPage />} />

        {/* ── Main app (admin / user roles) ── */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="expenses"         element={<ExpensesPage />} />
          <Route path="weekend-expenses" element={<WeekendExpensesPage />} />
          <Route path="contributions"    element={<ContributionsPage />} />
          <Route path="announcements"    element={<AnnouncementsPage />} />
          <Route path="rides"            element={<RidesPage />} />
          <Route path="cook"             element={<CookPage />} />
          <Route path="daily-menu"       element={<CookMenuPage />} />
          <Route path="flat-expenses"    element={<FlatExpensesPage />} />
          <Route path="admin"            element={<AdminPage />} />
          <Route path="logs"             element={<LogsPage />} />
          <Route path="profile"          element={<ProfilePage />} />
          <Route path="cook-requests"    element={<CookRequestsPage />} />
          {/* Any unknown sub-path inside the main app → 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Route>

        {/* ── Cook-only portal ── */}
        <Route
          path="/cook-portal"
          element={
            <CookRoute>
              <CookLayout />
            </CookRoute>
          }
        >
          <Route index element={<Navigate to="/cook-portal/dashboard" replace />} />
          <Route path="dashboard"        element={<CookDashboardPage />} />
          <Route path="cook"             element={<CookPage />} />
          <Route path="cook-requests"    element={<CookRequestsPage />} />
          <Route path="daily-menu"       element={<CookMenuPage />} />
          <Route path="weekend-expenses" element={<WeekendExpensesPage />} />
          <Route path="logs"             element={<LogsPage />} />
          <Route path="profile"          element={<ProfilePage />} />
          {/* Any unknown sub-path inside the cook portal → 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Route>

        {/* ── Truly unknown top-level paths → 404 ── */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  )
}

export default App
