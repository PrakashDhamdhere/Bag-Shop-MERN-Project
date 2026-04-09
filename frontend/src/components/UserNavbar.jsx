import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../features/auth/hooks/useAuth";

const DEFAULT_PROFILE_IMAGE = "https://ik.imagekit.io/PrakashDhamdhere/default-profile-image.webp?updatedAt=1771829673388";

const UserNavbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const navItems = [
    { label: "Shop", path: "/shop" },
    { label: "Cart", path: "/cart" },
    { label: "My Orders", path: "/my-orders" },
  ];

  const isActive = (path) => {
    if (path === "/shop") {
      return location.pathname === "/shop" || location.pathname.startsWith("/shop/");
    }
    return location.pathname === path;
  };

  return (
    <header className="w-full bg-white/90 backdrop-blur border-b border-zinc-200 shadow-sm sticky top-0 z-40">
      <div className="max-w-400 mx-auto px-6 py-3 flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={() => navigate("/shop")}
          className="text-3xl font-semibold italic text-[#4f2b18] cursor-pointer tracking-tight"
        >
          BagShop
        </button>

        <div className="flex items-center gap-2 rounded-full bg-zinc-100 p-1 border border-zinc-200">
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`px-4 py-2 rounded-full text-sm font-medium cursor-pointer transition-all ${
                isActive(item.path)
                  ? "bg-zinc-900 text-white shadow"
                  : "text-zinc-700 hover:bg-zinc-200"
              }`}
            >
              {item.label}
            </button>
          ))}

          <button
            onClick={() => navigate("/my-account")}
            className="h-10 w-10 rounded-full overflow-hidden border-2 border-zinc-300 hover:border-zinc-500 transition-colors cursor-pointer"
            aria-label="My Account"
          >
            <img
              src={user?.profileImage || user?.pictuer || DEFAULT_PROFILE_IMAGE}
              alt="Profile"
              onError={(e) => {
                e.currentTarget.src = DEFAULT_PROFILE_IMAGE;
              }}
              className="w-full h-full object-cover"
            />
          </button>
        </div>
      </div>
    </header>
  );
};

export default UserNavbar;
