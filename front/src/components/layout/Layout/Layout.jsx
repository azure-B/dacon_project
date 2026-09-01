import { Outlet } from 'react-router-dom';
import Header from '../Header/Header';
import Footer from '../Footer/Footer';
import './Layout.css';

export default function Layout() {
  return (
    <div className="layout min-h-screen flex flex-col bg-background text-on-background font-body-md antialiased">
      <Header />
      <main className="layout__main flex-1 w-full min-w-0">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
