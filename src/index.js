// src/index.js
import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import AppLayout from "./App";
import ChatPage, { action as chatAction } from "./routes/chat";
import {
  loader as meetingsLoader,
  action as meetingsAction,
} from "./routes/meetings";
import { loader as chatStreamLoader } from "./routes/chatStream";

const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <ChatPage />,
        action: chatAction,
      },
      {
        path: "meetings",
        loader: meetingsLoader,
        action: meetingsAction,
      },
      {
        path: "chat/stream",
        loader: chatStreamLoader,
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <RouterProvider router={router} />
);
