import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import { DataProvider } from "./DataContext";
import Datasets from "./components/Datasets";
import Dashboard from "./components/Dashboard";
import Login from "./pages/Login";
import Register from "./pages/Register";
import PipelineBuilder from "./components/PipelineBuilder";


function App() {
  return (
    <DataProvider>

      <BrowserRouter>

        <Routes>

          {/* Main Application */}
          <Route
          path="/datasets"
          element ={<Datasets />}
          />

          <Route
            path="/"
            element={<Dashboard />}
          />


          {/* Authentication Pages */}

          <Route
            path="/login"
            element={<Login />}
          />

          <Route
            path="/register"
            element={<Register />}
          />


          {/* Pipeline Builder */}

          <Route
            path="/pipeline"
            element={<PipelineBuilder />}
          />

        </Routes>

      </BrowserRouter>

    </DataProvider>
  );
}


export default App;