import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const DEFAULT_PROFILE_IMAGE = "https://ik.imagekit.io/PrakashDhamdhere/default-profile-image.webp?updatedAt=1771829673388";

const MyAccount = () => {
  const navigate = useNavigate();
  const { user, handleGetMe, handleUpdateProfile, handleLogout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    fullname: "",
    contact: "",
    profileImage: DEFAULT_PROFILE_IMAGE,
    address: "",
    city: "",
    state: "",
    pincode: "",
    country: "",
  });

  useEffect(() => {
    const init = async () => {
      try {
        await handleGetMe();
      } catch {
        navigate("/");
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  useEffect(() => {
    if (!user) return;
    setForm({
      fullname: user.fullname || "",
      contact: user.contact || "",
      profileImage: user.profileImage || user.pictuer || DEFAULT_PROFILE_IMAGE,
      address: user.address || "",
      city: user.city || "",
      state: user.state || "",
      pincode: user.pincode || "",
      country: user.country || "",
    });
  }, [user]);

  const resetFormFromUser = () => {
    setForm({
      fullname: user?.fullname || "",
      contact: user?.contact || "",
      profileImage: user?.profileImage || user?.pictuer || DEFAULT_PROFILE_IMAGE,
      address: user?.address || "",
      city: user?.city || "",
      state: user?.state || "",
      pincode: user?.pincode || "",
      country: user?.country || "",
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfileImageUpload = (e) => {
    if (!isEditing) return;
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setForm((prev) => ({
        ...prev,
        profileImage: reader.result || DEFAULT_PROFILE_IMAGE,
      }));
      setError("");
    };
    reader.onerror = () => {
      setError("Failed to read selected image");
    };
    reader.readAsDataURL(file);
  };

  const submitHandler = async (e) => {
    e.preventDefault();
    setSuccess("");
    setError("");

    try {
      setSaving(true);
      const payload = {
        fullname: form.fullname,
        contact: form.contact ? Number(form.contact) : null,
        profileImage: form.profileImage || DEFAULT_PROFILE_IMAGE,
        address: form.address,
        city: form.city,
        state: form.state,
        pincode: form.pincode,
        country: form.country,
      };

      const response = await handleUpdateProfile(payload);
      setSuccess(response.message || "Profile updated successfully");
      setIsEditing(false);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const onLogout = async () => {
    try {
      await handleLogout();
      navigate('/');
    } catch {
      navigate('/');
    }
  };

  if (loading) {
    return <div className="p-6">Loading account...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
        <h1 className="text-3xl font-semibold mb-6">My Account</h1>

        <div className="bg-white border border-zinc-200 rounded-xl p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6 pb-6 border-b border-zinc-200">
            <div className="relative w-24 h-24">
              <img
                src={form.profileImage || DEFAULT_PROFILE_IMAGE}
                alt="Profile"
                onError={(e) => {
                  e.currentTarget.src = DEFAULT_PROFILE_IMAGE;
                }}
                className="w-24 h-24 rounded-full object-cover border border-zinc-200"
              />
              <label className={`absolute -bottom-1 -right-1 w-8 h-8 rounded-full text-white flex items-center justify-center shadow ${isEditing ? "bg-zinc-900 cursor-pointer" : "bg-zinc-400 cursor-not-allowed"}`}>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={!isEditing}
                  onChange={handleProfileImageUpload}
                />
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M4 7h3l1.5-2h7L17 7h3v12H4V7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="12" cy="13" r="3.5" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </label>
            </div>
            <div>
              <p className="text-xl font-semibold">{user?.fullname || "-"}</p>
              <p className="text-zinc-600">{user?.email || "-"}</p>
              <p className="text-sm text-zinc-500 mt-1">
                Cart Items: {Array.isArray(user?.cart) ? user.cart.length : 0}
              </p>
            </div>
            <div className="md:ml-auto">
              <button
                type="button"
                onClick={onLogout}
                className="px-4 py-2 bg-red-500 text-white rounded-md cursor-pointer"
              >
                Logout
              </button>
            </div>
          </div>

          <form onSubmit={submitHandler} className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <div>
              <label className="text-sm text-zinc-600">Full Name</label>
              <input
                name="fullname"
                value={form.fullname}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="mt-1 w-full px-3 py-2 rounded-md bg-zinc-100 disabled:opacity-70"
                type="text"
                placeholder="Full Name"
              />
            </div>

            <div>
              <label className="text-sm text-zinc-600">Contact</label>
              <input
                name="contact"
                value={form.contact}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="mt-1 w-full px-3 py-2 rounded-md bg-zinc-100 disabled:opacity-70"
                type="number"
                placeholder="Contact Number"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-sm text-zinc-600">Address</label>
              <textarea
                name="address"
                value={form.address}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="mt-1 w-full px-3 py-2 rounded-md bg-zinc-100 min-h-24 disabled:opacity-70"
                placeholder="House no, street, landmark"
              />
            </div>

            <div>
              <label className="text-sm text-zinc-600">City</label>
              <input
                name="city"
                value={form.city}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="mt-1 w-full px-3 py-2 rounded-md bg-zinc-100 disabled:opacity-70"
                type="text"
                placeholder="City"
              />
            </div>

            <div>
              <label className="text-sm text-zinc-600">State</label>
              <input
                name="state"
                value={form.state}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="mt-1 w-full px-3 py-2 rounded-md bg-zinc-100 disabled:opacity-70"
                type="text"
                placeholder="State"
              />
            </div>

            <div>
              <label className="text-sm text-zinc-600">Pincode</label>
              <input
                name="pincode"
                value={form.pincode}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="mt-1 w-full px-3 py-2 rounded-md bg-zinc-100 disabled:opacity-70"
                type="text"
                placeholder="Pincode"
              />
            </div>

            <div>
              <label className="text-sm text-zinc-600">Country</label>
              <input
                name="country"
                value={form.country}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="mt-1 w-full px-3 py-2 rounded-md bg-zinc-100 disabled:opacity-70"
                type="text"
                placeholder="Country"
              />
            </div>

            <div className="md:col-span-2 flex items-center gap-3 mt-2">
              {!isEditing ? (
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(true);
                    setSuccess("");
                    setError("");
                  }}
                  className="bg-zinc-900 text-white px-5 py-2 rounded-md"
                >
                  Edit Profile
                </button>
              ) : (
                <>
                  <button
                    type="submit"
                    disabled={saving}
                    className="bg-blue-600 text-white px-5 py-2 rounded-md disabled:opacity-60"
                  >
                    {saving ? "Saving..." : "Save Profile"}
                  </button>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => {
                      resetFormFromUser();
                      setIsEditing(false);
                      setError("");
                    }}
                    className="bg-zinc-200 text-zinc-800 px-5 py-2 rounded-md disabled:opacity-60"
                  >
                    Cancel
                  </button>
                </>
              )}
              {success ? <p className="text-green-600 text-sm">{success}</p> : null}
              {error ? <p className="text-red-600 text-sm">{error}</p> : null}
            </div>
          </form>
        </div>
    </div>
  );
};

export default MyAccount;
