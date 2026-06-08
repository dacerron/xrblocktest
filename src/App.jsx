import BasicPinchDemo from './demos/BasicPinchDemo.jsx'
import MarkerTrackingDemo from './demos/MarkerTrackingDemo.jsx'
import ModelViewerDemo from './demos/ModelViewerDemo.jsx'
import PlanePhysicsDemo from './demos/PlanePhysicsDemo.jsx'
import TowerDefenseDemo from './demos/tower/TowerDefenseDemo.jsx'

const demo =
  new URLSearchParams(window.location.search).get('demo') || 'basic'

function App() {
  let body
  if (demo === 'modelviewer') body = <ModelViewerDemo />
  else if (demo === 'planes') body = <PlanePhysicsDemo />
  else if (demo === 'marker') body = <MarkerTrackingDemo />
  else if (demo === 'tower') body = <TowerDefenseDemo />
  else body = <BasicPinchDemo />

  return (
    <>
      <nav className="demo-nav" aria-label="Demo navigation">
        <a href="?demo=basic">Basic pinch</a>
        <span aria-hidden="true"> · </span>
        <a href="?demo=modelviewer">Model viewer</a>
        <span aria-hidden="true"> · </span>
        <a href="?demo=planes">Depth physics</a>
        <span aria-hidden="true"> · </span>
        <a href="?demo=marker">Image tracking</a>
        <span aria-hidden="true"> · </span>
        <a href="?demo=tower">Tower Security</a>
      </nav>
      {body}
    </>
  )
}

export default App
