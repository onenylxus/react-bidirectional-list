import TestList from './components/TestList';
import './App.css';

function App() {
  return (
    <div
      className="container"
      style={{
        display: 'flex',
        width: '100vw',
        height: '100vh',
        background: '#f8f8f8',
        margin: 0,
        padding: 0,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <TestList direction="row" />
    </div>
  );
}

export default App;
