import React, { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AnimatePresence } from "motion/react";
import { Navbar } from "./components/Navbar";
import { ScrollToTop } from "./components/ScrollToTop";
import { Gavel, Loader2 } from "lucide-react";
import { useAuth } from "./context/AuthContext";
import { useServerTime } from "./hooks/useServerTime";

// Lazy load pages for performance and to isolate side-effects (like Stripe)
const HomePage = lazy(() => import("./pages/HomePage").then(m => ({ default: m.HomePage })));
const LandingPage = lazy(() => import("./pages/LandingPage").then(m => ({ default: m.LandingPage })));
const ProfilePage = lazy(() => import("./pages/ProfilePage").then(m => ({ default: m.ProfilePage })));
const OrdersPage = lazy(() => import("./pages/OrdersPage").then(m => ({ default: m.OrdersPage })));
const LoginPage = lazy(() => import("./pages/LoginPage").then(m => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import("./pages/RegisterPage").then(m => ({ default: m.RegisterPage })));
const CreateAuctionPage = lazy(() => import("./pages/CreateAuctionPage").then(m => ({ default: m.CreateAuctionPage })));
const AuctionDetailPage = lazy(() => import("./pages/AuctionDetailPage").then(m => ({ default: m.AuctionDetailPage })));
const MyConsignmentsPage = lazy(() => import("./pages/MyAuctionsPage").then(m => ({ default: m.MyAuctionsPage })));
const DashboardPage = lazy(() => import("./pages/DashboardPage").then(m => ({ default: m.DashboardPage })));
const AuctioneerDashboardPage = lazy(() => import("./pages/AuctioneerDashboardPage").then(m => ({ default: m.AuctioneerDashboardPage })));
const ForgotPasswordPage = lazy(() => import("./pages/ForgotPasswordPage").then(m => ({ default: m.ForgotPasswordPage })));
const SellerAnalyticsPage = lazy(() => import("./pages/SellerAnalyticsPage").then(m => ({ default: m.SellerAnalyticsPage })));
const MediatorDashboardPage = lazy(() => import("./pages/MediatorDashboardPage").then(m => ({ default: m.MediatorDashboardPage })));

const PageLoader = () => (
  <div className="h-[60vh] flex flex-col items-center justify-center gap-6 relative">
    <Loader2 className="w-12 h-12 animate-spin text-gold relative z-10" />
    <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-ink/70 relative z-10 animate-pulse">Loading Collection</p>
  </div>
);

export default function App() {
  const { isAuthenticated, user } = useAuth();
  useServerTime();

  return (
    <BrowserRouter>
      <ScrollToTop />
      <div className="min-h-screen flex flex-col bg-paper">
        <Navbar />

        <main className="grow">
          <Suspense fallback={<PageLoader />}>
            <AnimatePresence mode="wait">
              <Routes>
                {/* Home Route */}
                <Route
                  path="/"
                  element={
                    !isAuthenticated ? (
                      <LandingPage />
                    ) : user?.role === "auctioneer" ? (
                      <AuctioneerDashboardPage />
                    ) : (
                      <DashboardPage />
                    )
                  }
                />

                <Route
                  path="/auctioneer-dashboard"
                  element={<AuctioneerDashboardPage />}
                />
                <Route
                  path="/dashboard"
                  element={<Navigate to="/" replace />}
                />
                <Route
                  path="/auctioneer/dashboard"
                  element={<AuctioneerDashboardPage />}
                />

                <Route
                  path="/auctioneer"
                  element={
                    isAuthenticated && user?.role === "auctioneer" ? (
                      <AuctioneerDashboardPage />
                    ) : (
                      <DashboardPage />
                    )
                  }
                />

                {/* General Routes */}
                <Route path="/gallery" element={<HomePage />} />
                <Route path="/browse" element={<HomePage />} />
                <Route path="/login" element={!isAuthenticated ? <LoginPage /> : <Navigate to="/" />} />
                <Route path="/register" element={!isAuthenticated ? <RegisterPage /> : <Navigate to="/" />} />
                <Route path="/forgot-password" element={!isAuthenticated ? <ForgotPasswordPage /> : <Navigate to="/" />} />
                
                {/* Protected Routes */}
                <Route path="/create" element={isAuthenticated ? <CreateAuctionPage /> : <Navigate to="/login" />} />
                <Route path="/my-consignments" element={isAuthenticated ? <MyConsignmentsPage /> : <Navigate to="/login" />} />
                <Route path="/auction/:id" element={isAuthenticated ? <AuctionDetailPage /> : <Navigate to="/login" />} />
                <Route path="/profile" element={isAuthenticated ? <ProfilePage /> : <Navigate to="/login" />} />
                <Route path="/orders" element={isAuthenticated ? <OrdersPage /> : <Navigate to="/login" />} />
                <Route path="/seller-analytics" element={isAuthenticated ? <SellerAnalyticsPage /> : <Navigate to="/login" />} />
                <Route path="/mediator-dashboard" element={isAuthenticated ? <MediatorDashboardPage /> : <Navigate to="/login" />} />
              </Routes>
            </AnimatePresence>
          </Suspense>
        </main>

        {/* Footer */}
        <footer className="border-t border-ink/10 py-20 px-8 mt-32 bg-white/50 backdrop-blur-md relative overflow-hidden">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-gold/5 rounded-full blur-[100px] pointer-events-none"></div>
          <div className="max-w-7xl mx-auto relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-16 mb-16">
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <Gavel className="w-8 h-8 text-gold" />
                  <span className="text-2xl font-serif font-bold tracking-tight text-ink">
                    BIDVORA
                  </span>
                </div>
                <p className="text-sm text-ink/70 font-light leading-relaxed max-w-xs">
                  The world's most exclusive marketplace for rare acquisitions
                  and timeless treasures. Curated for the discerning collector.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-8 col-span-1 md:col-span-2">
                <div>
                  <h4 className="text-[10px] uppercase tracking-[0.3em] font-bold mb-6 text-gold">
                    Marketplace
                  </h4>
                  <ul className="space-y-4 text-xs uppercase tracking-widest font-medium text-ink/70">
                    <li>
                      <a href="#" className="hover:text-gold transition-all">
                        Browse All
                      </a>
                    </li>
                    <li>
                      <a href="#" className="hover:text-gold transition-all">
                        Recent Sales
                      </a>
                    </li>
                    <li>
                      <a href="#" className="hover:text-gold transition-all">
                        Upcoming
                      </a>
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className="text-[10px] uppercase tracking-[0.3em] font-bold mb-6 text-gold">
                    Company
                  </h4>
                  <ul className="space-y-4 text-xs uppercase tracking-widest font-medium text-ink/70">
                    <li>
                      <a href="#" className="hover:text-gold transition-all">
                        About
                      </a>
                    </li>
                    <li>
                      <a href="#" className="hover:text-gold transition-all">
                        Privacy
                      </a>
                    </li>
                    <li>
                      <a href="#" className="hover:text-gold transition-all">
                        Terms
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="pt-12 border-t border-ink/10 flex flex-col md:flex-row justify-between items-center gap-6">
              <p className="text-[9px] uppercase tracking-[0.4em] text-ink/50">
                © 2026 Bidvora International. All Rights Reserved.
              </p>
              <div className="flex gap-10">
                <span className="text-[9px] uppercase tracking-[0.4em] text-ink/50">
                  London
                </span>
                <span className="text-[9px] uppercase tracking-[0.4em] text-ink/50">
                  New York
                </span>
                <span className="text-[9px] uppercase tracking-[0.4em] text-ink/50">
                  Hong Kong
                </span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </BrowserRouter>
  );
}
