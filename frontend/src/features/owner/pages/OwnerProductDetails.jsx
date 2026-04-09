import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import OwnerHeader from "../components/OwnerHeader";
import OwnerSidebar from "../components/OwnerSidebar";
import {
  deleteProduct,
  getAdminProductById,
  ownerLogout,
  setProductPublishState,
} from "../services/owner.api";

const OwnerProductDetails = () => {
  const navigate = useNavigate();
  const { productId } = useParams();

  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState(null);
  const [salesCount, setSalesCount] = useState(0);
  const [error, setError] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const response = await getAdminProductById(productId);
        setProduct(response.product || null);
        setSalesCount(Number(response.salesCount || 0));
      } catch (err) {
        const status = err.response?.status;
        if (status === 401 || status === 403) {
          navigate("/owners/login");
          return;
        }
        setError(err.response?.data?.message || "Could not load product details");
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [productId]);

  const onLogout = async () => {
    await ownerLogout();
    navigate("/owners/login");
  };

  const onDelete = async () => {
    if (!product?._id || deleting) return;

    setError("");
    try {
      setDeleting(true);
      await deleteProduct(product._id);
      navigate("/owners/admin");
    } catch (err) {
      setError(err.response?.data?.message || "Could not delete product");
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const onTogglePublish = async () => {
    if (!product?._id || publishing) return;

    setError("");
    try {
      setPublishing(true);
      const response = await setProductPublishState(product._id, !product.isPublished);
      setProduct(response.product || product);
    } catch (err) {
      setError(err.response?.data?.message || "Could not update publish status");
    } finally {
      setPublishing(false);
    }
  };

  if (loading) {
    return <div className="p-6">Loading product details...</div>;
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-zinc-100 text-zinc-800">
        <OwnerHeader onLogout={onLogout} />
        <div className="max-w-400 mx-auto px-6 py-8">
          <p className="text-red-600">{error || "Product not found"}</p>
          <button
            onClick={() => navigate("/owners/admin")}
            className="mt-4 px-4 py-2 rounded-md bg-zinc-900 text-white cursor-pointer"
          >
            Back to Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-800">
      <OwnerHeader onLogout={onLogout} />

      <div className="max-w-400 mx-auto px-6 py-8 box-border min-h-[calc(100vh-81px)] grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6 items-start">
        <OwnerSidebar />

        <section className="h-full overflow-y-auto pr-2">
          <div className="bg-white border border-zinc-200 rounded-xl p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h1 className="text-3xl font-semibold">{product.name}</h1>
              <div className="flex items-center gap-2">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    product.isPublished
                      ? "bg-emerald-600 text-white"
                      : "bg-zinc-300 text-zinc-800"
                  }`}
                >
                  {product.isPublished ? "Published" : "Unpublished"}
                </span>
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-zinc-900 text-white">
                  Sold: {salesCount}
                </span>
              </div>
            </div>

            {error ? <p className="text-red-600 text-sm mt-3">{error}</p> : null}

            <div className="mt-5 grid grid-cols-1 md:grid-cols-[320px_1fr] gap-6">
              <div
                className="w-full h-80 rounded-lg p-4"
                style={{ backgroundColor: product.bgcolor || "#d4d4d8" }}
              >
                {product.image ? (
                  <img
                    src={`data:image/jpeg;base64,${product.image}`}
                    alt={product.name}
                    className="w-full h-full object-contain"
                  />
                ) : null}
              </div>

              <div className="space-y-3">
                <p className="text-zinc-700 text-lg">
                  Price: <span className="font-semibold">Rs {product.price}</span>
                </p>
                <p className="text-zinc-700 text-lg">
                  Discount: <span className="font-semibold">{product.discount || 0}%</span>
                </p>

                <div className="pt-2">
                  <p className="text-zinc-600 text-sm mb-2">Theme Colors</p>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-5 h-5 rounded border border-zinc-300"
                        style={{ backgroundColor: product.bgcolor || "#d4d4d8" }}
                      />
                      <span className="text-sm text-zinc-700">Background</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className="w-5 h-5 rounded border border-zinc-300"
                        style={{ backgroundColor: product.panelcolor || "#52525b" }}
                      />
                      <span className="text-sm text-zinc-700">Panel</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className="w-5 h-5 rounded border border-zinc-300"
                        style={{ backgroundColor: product.textcolor || "#f4f4f5" }}
                      />
                      <span className="text-sm text-zinc-700">Text</span>
                    </div>
                  </div>
                </div>

                <div className="pt-5 flex flex-wrap items-center gap-3">
                  <button
                    onClick={onTogglePublish}
                    disabled={publishing}
                    className={`px-4 py-2 rounded-md text-white cursor-pointer disabled:opacity-60 ${
                      product.isPublished ? "bg-amber-600" : "bg-emerald-600"
                    }`}
                  >
                    {publishing
                      ? "Updating..."
                      : product.isPublished
                      ? "Unpublish Product"
                      : "Publish Product"}
                  </button>
                  <button
                    onClick={() => navigate(`/owners/edit-product/${product._id}`)}
                    className="px-4 py-2 rounded-md bg-zinc-900 text-white cursor-pointer"
                  >
                    Edit Product
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="px-4 py-2 rounded-md bg-red-600 text-white cursor-pointer"
                  >
                    Delete Product
                  </button>
                  <button
                    onClick={() => navigate("/owners/admin")}
                    className="px-4 py-2 rounded-md bg-zinc-200 text-zinc-800 cursor-pointer"
                  >
                    Back
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {showDeleteConfirm ? (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-xl p-6 shadow-2xl">
            <h3 className="text-xl font-semibold">Delete Product?</h3>
            <p className="text-zinc-600 mt-2">
              Are you sure you want to delete "{product.name}"? This action cannot be undone.
            </p>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="px-4 py-2 rounded-md bg-zinc-200 text-zinc-800 cursor-pointer disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                onClick={onDelete}
                disabled={deleting}
                className="px-4 py-2 rounded-md bg-red-600 text-white cursor-pointer disabled:opacity-60"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default OwnerProductDetails;
