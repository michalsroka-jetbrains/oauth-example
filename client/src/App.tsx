
import './App.css';
import LoginButton from "./components/oauth/LoginButton";
import BigQueryButton from "./components/oauth/BigQueryButton";


const App = () => {

  return (
    <div className="App">
      <LoginButton />
      <BigQueryButton />
    </div>
  );
}

export default App;
