import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';

/**
 * RootLayout — the app shell shared by all pages: a sticky navbar, the routed
 * page content (<Outlet/>), and a footer. Uses a flex column so the footer
 * sticks to the bottom even on short pages.
 */
export default function RootLayout() {
  return (
    <div className="flex min-h-svh flex-col">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
