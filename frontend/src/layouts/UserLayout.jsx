import React from "react";
import { Outlet } from "react-router-dom";
import UserNavbar from "../components/UserNavbar";
import { useFlash } from "../features/flash/hooks/useFlash";

const UserLayout = () => {
  const { flash, clearFlash } = useFlash();

  const flashStyles = flash?.type === "error"
    ? "bg-red-600 text-white"
    : "bg-green-600 text-white";

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-800">
      {flash ? (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50">
          <div
            className={`flash-toast-animate px-4 py-3 rounded-md shadow-lg flex items-center gap-3 ${flashStyles}`}
            style={{ animationDuration: `${flash.duration || 2500}ms` }}
          >
            <span className="text-sm font-medium">{flash.message}</span>
            <button
              onClick={clearFlash}
              className="text-white/90 hover:text-white text-sm cursor-pointer"
              aria-label="Close message"
            >
              x
            </button>
          </div>
        </div>
      ) : null}
      <UserNavbar />
      <Outlet />
    </div>
  );
};

export default UserLayout;
