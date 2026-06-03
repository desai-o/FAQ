import { Routes, Route } from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import Questions from "./pages/Questions";
import Categories from "./pages/Categories";
import Contributors from "./pages/Contributors";
import Bookmarks from "./pages/Bookmarks";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/questions" element={<Questions />} />
      <Route path="/categories" element={<Categories />} />
      <Route path="/contributors" element={<Contributors />} />
      <Route path="/bookmarks" element={<Bookmarks />} />
    </Routes>
  );
}

export default App;