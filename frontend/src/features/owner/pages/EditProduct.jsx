import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getAdminProductById, ownerLogout, updateProduct } from "../services/owner.api";
import OwnerHeader from "../components/OwnerHeader";
import OwnerSidebar from "../components/OwnerSidebar";

const HEX6 = /^#([0-9a-fA-F]{6})$/;

const getPickerValue = (value, fallback) => {
  return HEX6.test(value) ? value : fallback;
};

const toHashColor = (value, fallback) => {
  const raw = String(value || "").trim();
  if (!raw) return fallback;

  if (HEX6.test(raw)) return raw.toLowerCase();

  const normalized = raw.startsWith("#") ? raw : `#${raw}`;
  return HEX6.test(normalized) ? normalized.toLowerCase() : fallback;
};

const ColorField = ({ label, value, onChange, placeholder, fallback }) => {
  return (
    <label className="text-sm text-zinc-700">
      <span className="block mb-1 font-medium">{label}</span>
      <div className="flex items-center gap-2">
        <div className="h-10 w-12 rounded-md border border-zinc-300 overflow-hidden shrink-0 bg-white">
          <input
            type="color"
            value={getPickerValue(value, fallback)}
            onChange={(e) => onChange(e.target.value)}
            className="h-full w-full p-0 border-0 cursor-pointer"
          />
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 min-w-0 px-3 py-2 border rounded-md border-zinc-300"
          placeholder={placeholder}
        />
      </div>
      <p className="text-xs text-zinc-500 mt-1">Use hex format like #f3f4f6</p>
    </label>
  );
};

const EditProduct = () => {
  const navigate = useNavigate();
  const { productId } = useParams();

  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    discount: "",
    stock: "",
    bgcolor: "#f3f4f6",
    panelcolor: "#ffffff",
    textcolor: "#111827",
    image: "",
  });

  const [imagePreview, setImagePreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState("");

  const onLogout = async () => {
    await ownerLogout();
    navigate("/owners/login");
  };

  useEffect(() => {
    const init = async () => {
      try {
        const response = await getAdminProductById(productId);
        const product = response.product;

        setForm({
          name: product?.name || "",
          description: product?.description || "",
          price: String(product?.price ?? ""),
          discount: String(product?.discount ?? ""),
          stock: String(product?.stock ?? ""),
          bgcolor: toHashColor(product?.bgcolor, "#f3f4f6"),
          panelcolor: toHashColor(product?.panelcolor, "#ffffff"),
          textcolor: toHashColor(product?.textcolor, "#111827"),
          image: "",
        });
        if (product?.image) {
          setImagePreview(`data:image/jpeg;base64,${product.image}`);
        }
      } catch (err) {
        setError(err.response?.data?.message || "Could not load product");
      } finally {
        setPageLoading(false);
      }
    };

    init();
  }, [productId]);

  const onImageChange = (file) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const fullBase64 = String(reader.result);
      const base64 = fullBase64.split(",")[1] || "";
      setForm((prev) => ({ ...prev, image: base64 }));
      setImagePreview(fullBase64);
    };
    reader.readAsDataURL(file);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await updateProduct(productId, {
        ...form,
        bgcolor: toHashColor(form.bgcolor, "#f3f4f6"),
        panelcolor: toHashColor(form.panelcolor, "#ffffff"),
        textcolor: toHashColor(form.textcolor, "#111827"),
        price: Number(form.price),
        discount: Number(form.discount),
        stock: Number(form.stock),
      });
      navigate("/owners/admin");
    } catch (err) {
      setError(err.response?.data?.message || "Could not update product");
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return <div className="p-6">Loading product...</div>;
  }

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-800">
      <OwnerHeader onLogout={onLogout} />

      <div className="max-w-400 mx-auto px-6 py-8 box-border min-h-[calc(100vh-81px)] grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6 items-start">
      <OwnerSidebar />

      <section className="h-full overflow-y-auto pr-2">
      <h1 className="text-3xl font-semibold mb-5">Edit Product</h1>

      <form onSubmit={onSubmit} className="border border-zinc-200 rounded-lg p-5 bg-white">
        <input
          type="text"
          placeholder="Name"
          value={form.name}
          onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
          className="w-full px-3 py-2 border rounded-md mb-3 border-zinc-300"
          required
        />
        <textarea
          placeholder="Description"
          value={form.description}
          onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
          className="w-full px-3 py-2 border rounded-md mb-3 border-zinc-300 min-h-20"
        />
        <div className="grid grid-cols-3 gap-2 mb-3">
          <input
            type="number"
            min="0"
            placeholder="Price"
            value={form.price}
            onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))}
            className="px-3 py-2 border rounded-md border-zinc-300"
            required
          />
          <input
            type="number"
            min="0"
            placeholder="Discount"
            value={form.discount}
            onChange={(e) => setForm((prev) => ({ ...prev, discount: e.target.value }))}
            className="px-3 py-2 border rounded-md border-zinc-300"
          />
          <input
            type="number"
            min="0"
            placeholder="Stock"
            value={form.stock}
            onChange={(e) => setForm((prev) => ({ ...prev, stock: e.target.value }))}
            className="px-3 py-2 border rounded-md border-zinc-300"
          />
        </div>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => onImageChange(e.target.files?.[0])}
          className="w-full px-3 py-2 border rounded-md mb-3 border-zinc-300"
        />
        {imagePreview ? (
          <div className="mb-3 flex justify-center">
            <img
              src={imagePreview}
              alt="Preview"
              className="max-w-xs max-h-48 rounded-md border border-zinc-300 object-contain"
            />
          </div>
        ) : null}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <ColorField
            label="Background Color"
            value={form.bgcolor}
            onChange={(next) => setForm((prev) => ({ ...prev, bgcolor: next }))}
            placeholder="#f3f4f6"
            fallback="#f3f4f6"
          />
          <ColorField
            label="Panel Color"
            value={form.panelcolor}
            onChange={(next) => setForm((prev) => ({ ...prev, panelcolor: next }))}
            placeholder="#ffffff"
            fallback="#ffffff"
          />
          <ColorField
            label="Text Color"
            value={form.textcolor}
            onChange={(next) => setForm((prev) => ({ ...prev, textcolor: next }))}
            placeholder="#111827"
            fallback="#111827"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 rounded-md bg-zinc-900 text-white cursor-pointer disabled:opacity-60"
          >
            {loading ? "Updating..." : "Update"}
          </button>
          <button
            type="button"
            onClick={() => navigate('/owners/admin')}
            disabled={loading}
            className="px-4 py-2 rounded-md bg-zinc-200 text-zinc-800 cursor-pointer disabled:opacity-60"
          >
            Cancel
          </button>
        </div>

        {error ? <p className="text-red-600 text-sm mt-3">{error}</p> : null}
      </form>

      </section>
      </div>
    </div>
  );
};

export default EditProduct;
