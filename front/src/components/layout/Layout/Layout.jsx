import { useEffect, useRef, useState } from 'react';
import { useLocation, useOutlet } from 'react-router-dom';
import Header from '../Header/Header';
import Footer from '../Footer/Footer';
import './Layout.css';

export default function Layout() {
  const location = useLocation();
  const outlet = useOutlet();
  const outletRef = useRef(outlet);
  const locationRef = useRef(location);
  const [displayedPath, setDisplayedPath] = useState(location.pathname);
  const [displayOutlet, setDisplayOutlet] = useState(outlet);
  const [transitionStage, setTransitionStage] = useState('enter');

  outletRef.current = outlet;
  locationRef.current = location;

  useEffect(() => {
    if (transitionStage !== 'enter') return;
    if (location.pathname === displayedPath) return;
    setTransitionStage('exit');
  }, [location.pathname, displayedPath, transitionStage]);

  useEffect(() => {
    if (transitionStage !== 'exit') return undefined;
    const timer = window.setTimeout(() => {
      const nextLocation = locationRef.current;
      setDisplayOutlet(outletRef.current);
      setDisplayedPath(nextLocation.pathname);
      setTransitionStage('enter');
    }, 220);
    return () => window.clearTimeout(timer);
  }, [transitionStage]);

  const handleAnimationEnd = (event) => {
    if (event.target !== event.currentTarget) return;
    if (transitionStage !== 'exit') return;

    const nextLocation = locationRef.current;
    setDisplayOutlet(outletRef.current);
    setDisplayedPath(nextLocation.pathname);
    setTransitionStage('enter');
  };

  return (
    <div className="layout min-h-screen flex flex-col bg-canvas-deep text-on-surface font-body-md antialiased">
      <Header />
      <main className="layout__main flex-1 w-full min-w-0 pt-0">
        <div
          className={`layout__page layout__page--${transitionStage}`}
          onAnimationEnd={handleAnimationEnd}
        >
          {displayOutlet}
        </div>
      </main>
      <Footer />
    </div>
  );
}
