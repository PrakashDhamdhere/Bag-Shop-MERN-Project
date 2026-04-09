import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getAdminProducts,
  ownerLogout,
} from "../services/owner.api";
import OwnerSidebar from "../components/OwnerSidebar";
import OwnerHeader from "../components/OwnerHeader";

const OwnerAdmin = () => {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("popular");

  const loadProducts = async () => {
    const response = await getAdminProducts();
    setProducts(response.products || []);
  };

  useEffect(() => {
    const init = async () => {
      try {
        await loadProducts();
      } catch {
        navigate("/owners/login");
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  const onLogout = async () => {
    await ownerLogout();
    navigate("/owners/login");
  };

  const displayedProducts = [...products].sort((a, b) => {
    if (sortBy === "price-low") return Number(a.price) - Number(b.price);
    if (sortBy === "price-high") return Number(b.price) - Number(a.price);
    return Number(b.salesCount || 0) - Number(a.salesCount || 0);
  });

  if (loading) {
    return <div className="p-6">Loading admin panel...</div>;
  }

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-800">
      <OwnerHeader onLogout={onLogout} />

      <div className="max-w-400 mx-auto px-6 py-8 box-border min-h-[calc(100vh-81px)] grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6 items-start">
        <OwnerSidebar />

        <section className="h-full overflow-y-auto pr-2">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h1 className="text-3xl font-semibold">Products</h1>
            <label className="text-sm text-zinc-700 flex items-center gap-2">
              Sort
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-white border border-zinc-300 rounded px-3 py-2"
              >
                <option value="popular">Popular</option>
                <option value="price-low">Price Low to High</option>
                <option value="price-high">Price High to Low</option>
              </select>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
            {displayedProducts.map((product) => (
              <div
                key={product._id}
                onClick={() => navigate(`/owners/product/${product._id}`)}
                className={`rounded-sm overflow-hidden cursor-pointer transition-transform hover:-translate-y-0.5 ${
                  product.isPublished ? "opacity-100" : "opacity-55"
                }`}
                style={{ backgroundColor: product.bgcolor || "#d4d4d8" }}
              >
                <div className="h-65 p-3">
                  {product.image ? (
                    <img
                      src={`data:image/jpeg;base64,${product.image}`}
                      alt={product.name}
                      className="w-full h-full object-contain"
                    />
                  ) : null}
                </div>

                <div
                  className="p-4 flex items-center justify-between gap-3"
                  style={{
                    backgroundColor: product.panelcolor || "#52525b",
                    color: product.textcolor || "#f4f4f5",
                  }}
                >
                  <div>
                    <h2 className="text-2xl leading-tight">{product.name}</h2>
                    <p className="text-xl leading-tight">Rs {product.price}</p>
                    <p className="text-xs mt-1 opacity-90">
                      {product.isPublished ? "Published" : "Unpublished"}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default OwnerAdmin;
