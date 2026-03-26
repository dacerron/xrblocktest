import BasicPinchDemo from './demos/BasicPinchDemo.jsx'
import ModelViewerDemo from './demos/ModelViewerDemo.jsx'
import PlanePhysicsDemo from './demos/PlanePhysicsDemo.jsx'

const demo =
  new URLSearchParams(window.location.search).get('demo') || 'basic'

function App() {
  let body
  if (demo === 'modelviewer') body = <ModelViewerDemo />
  else if (demo === 'planes') body = <PlanePhysicsDemo />
  else body = <BasicPinchDemo />

  return (
    <>
      <nav className="demo-nav" aria-label="Demo navigation">
        <a href="?demo=basic">Basic pinch</a>
        <span aria-hidden="true"> · </span>
        <a href="?demo=modelviewer">Model viewer</a>
        <span aria-hidden="true"> · </span>
        <a href="?demo=planes">Plane physics</a>
      </nav>
      {body}
    </>
  )
}

export default App
