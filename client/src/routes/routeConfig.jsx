import { Navigate } from "react-router-dom";
import AuthPage from "../pages/AuthPage";
import ProfilePage from "../pages/ProfilePage";
import ConnectionsPage from "../pages/ConnectionsPage";
import ChatPage from "../pages/ChatPage";
import ProjectsPage from "../pages/ProjectsPage";
import PublicProfilePage from "../pages/PublicProfilePage";
import DashboardLayout from "../layouts/DashboardLayout";
import AuthLayout from "../layouts/AuthLayout";
import { ProtectedRoute } from "../components/ProtectedRoute";

export const routeConfig = [
  {
    path: "/auth",
    element: <AuthLayout><AuthPage /></AuthLayout>
  },
  {
    path: "/profile/:id",
    element: <PublicProfilePage />
  },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <ProfilePage />
      },
      {
        path: "profile",
        element: <ProfilePage />
      },
      {
        path: "connections",
        element: <ConnectionsPage />
      },
      {
        path: "messages",
        element: <ChatPage />
      },
      {
        path: "projects",
        element: <ProjectsPage />
      }
    ]
  },
  {
    path: "*",
    element: <Navigate to="/" replace />
  }
];
