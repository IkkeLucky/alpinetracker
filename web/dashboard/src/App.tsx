import { useState } from 'react';
import FleetMap from './pages/FleetMap';
import GeofenceEditor from './pages/GeofenceEditor';
import './App.css';

type View = 'fleet' | 'geofence';

function App() {
  const [view, setView] = useState<View>('fleet');

  return (
    <div className="app">
      <header className="app-header">
        <h1>Alpine E-Bike Fleet Tracker</h1>
        <nav>
          <button className={view === 'fleet' ? 'active' : ''} onClick={() => setView('fleet')}>
            Fleet map
          </button>
          <button
            className={view === 'geofence' ? 'active' : ''}
            onClick={() => setView('geofence')}
          >
            Geofence editor
          </button>
        </nav>
      </header>
      <main>{view === 'fleet' ? <FleetMap /> : <GeofenceEditor />}</main>
    </div>
  );
}

export default App;
