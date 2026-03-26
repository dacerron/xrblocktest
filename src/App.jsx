import BasicPinchDemo from './demos/BasicPinchDemo.jsx'
import ModelViewerDemo from './demos/ModelViewerDemo.jsx'

const demo =
  new URLSearchParams(window.location.search).get('demo') || 'basic'

function App() {
  return (
    <>
      <nav className="demo-nav" aria-label="Demo navigation">
        <a href="?demo=basic">Basic pinch</a>
        <span aria-hidden="true"> · </span>
        <a href="?demo=modelviewer">Model viewer</a>
      </nav>
      {demo === 'modelviewer' ? <ModelViewerDemo /> : <BasicPinchDemo />}
    </>
  )
}

export default App
