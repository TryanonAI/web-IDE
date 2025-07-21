import App from "./App.tsx";
import DashLayout from "./components/layout/DashLayout.tsx";
import Demo from "./routes/Demo.tsx";
import ErrorPage from "./components/common/ErrorPage.tsx";
import Profile from "./routes/Profile.tsx";
import ProjectDashboard from "./routes/ProjectDashboard.tsx";
import Projects from "./routes/Projects.tsx";
import RootLayout from "./components/layout/RootLayout.tsx";
import Templates from "./routes/Templates.tsx";
import { createHashRouter, RouterProvider } from "react-router";
import { createRoot } from "react-dom/client";
import "./index.css";

const router = createHashRouter([
  {
    path: "/",
    element: <RootLayout />,
    errorElement: <ErrorPage />,

    children: [
      {
        index: true,
        element: <App />,
      },
      {
        path: "demo",
        element: <Demo />,
      },
      {
        element: <DashLayout />,
        children: [
          {
            path: "projects",
            children: [
              {
                index: true,
                element: <Projects />,
              },
              {
                path: ":projectId",
                element: <ProjectDashboard />,
              },
            ],
          },
          {
            path: "templates",
            index: true,
            element: <Templates />,
          },
          {
            path: "profile",
            index: true,
            element: <Profile />,
          },
        ],
      },
    ],
  },
]);

createRoot(document.getElementById("root")!).render(
  <RouterProvider router={router} />
);
