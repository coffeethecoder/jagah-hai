// The site shell: navigation, the current page, and the footer.
import { useRoute } from './lib/router';
import { Footer, Nav } from './components/Nav';
import { Home } from './pages/Home';
import { Simulator } from './pages/Simulator';
import { Findings } from './pages/Findings';
import { Method } from './pages/Method';

export function App() {
  const path = useRoute();
  return (
    <>
      <Nav path={path} />
      {path === '/' && <Home />}
      {path === '/simulator' && <Simulator />}
      {path === '/findings' && <Findings />}
      {path === '/method' && <Method />}
      {path !== '/simulator' && <Footer />}
    </>
  );
}
