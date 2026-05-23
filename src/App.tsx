import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from '@/components/AppLayout/index'
import { BrandLoader } from '@/components/BrandLoader'
import { ProtectedRoute, PublicOnlyRoute } from '@/components/ProtectedRoute'
import { CookLayout } from '@/components/CookLayout/index'
import { CookRoute } from '@/components/CookRoute/index'
import { NotFoundPage } from '@/containers/NotFound'

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
  import('@/containers/Login').then((m) => ({ default: m.LoginPage })),
)
const RegisterPage = lazy(() =>
  import('@/containers/Register').then((m) => ({ default: m.RegisterPage })),
)
const DashboardPage = lazy(() =>
  import('@/containers/Dashboard').then((m) => ({ default: m.DashboardPage })),
)
const ExpensesPage = lazy(() =>
  import('@/containers/Expenses').then((m) => ({ default: m.ExpensesPage })),
)
const WeekendExpensesPage = lazy(() =>
  import('@/containers/WeekendExpenses').then((m) => ({ default: m.WeekendExpensesPage })),
)
const RidesPage = lazy(() =>
  import('@/containers/Rides').then((m) => ({ default: m.RidesPage })),
)
const AdminPage = lazy(() =>
  import('@/containers/Admin').then((m) => ({ default: m.AdminPage })),
)
const LogsPage = lazy(() =>
  import('@/containers/Logs').then((m) => ({ default: m.LogsPage })),
)
const ContributionsPage = lazy(() =>
  import('@/containers/Contributions').then((m) => ({ default: m.ContributionsPage })),
)
const AnnouncementsPage = lazy(() =>
  import('@/containers/Announcements').then((m) => ({ default: m.AnnouncementsPage })),
)
const CookDashboardPage = lazy(() =>
  import('@/containers/CookDashboard').then((m) => ({ default: m.CookDashboardPage })),
)
const CookRequestsPage = lazy(() =>
  import('@/containers/CookRequests').then((m) => ({ default: m.CookRequestsPage })),
)
const CookPage = lazy(() =>
  import('@/containers/Cook').then((m) => ({ default: m.CookPage })),
)
const CookMenuPage = lazy(() =>
  import('@/containers/CookMenu').then((m) => ({ default: m.CookMenuPage })),
)
const FlatExpensesPage = lazy(() =>
  import('@/containers/FlatExpenses').then((m) => ({ default: m.FlatExpensesPage })),
)
const ProfilePage = lazy(() =>
  import('@/containers/Profile').then((m) => ({ default: m.ProfilePage })),
)
const ForgotPasswordPage = lazy(() =>
  import('@/containers/ForgotPassword').then((m) => ({ default: m.ForgotPasswordPage })),
)
const ResetPasswordPage = lazy(() =>
  import('@/containers/ResetPassword').then((m) => ({ default: m.ResetPasswordPage })),
)
const PendingApprovalPage = lazy(() =>
  import('@/containers/PendingApproval').then((m) => ({ default: m.PendingApprovalPage })),
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
          <Route path="flat-expenses"    element={<FlatExpensesPage />} />
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
