
import './App.css';
import LoginButton from "./components/oauth/LoginButton";
import BigQueryButton from "./components/oauth/BigQueryButton";


const App = () => {

  return (
    <div className="App">
      <h1>OAuth example</h1>
      <LoginButton />
      <BigQueryButton />
    </div>
  );
}

export default App;
