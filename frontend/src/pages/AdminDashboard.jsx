import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getProducts, getCategories } from "../services/api";

function AdminDashboard() {
  const navigate = useNavigate();

  const [productCount, setProductCount] = useState(0);
  const [categoryCount, setCategoryCount] = useState(0);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const products = await getProducts();
        const categories = await getCategories();

        setProductCount(products.total);
        setCategoryCount(categories.length);
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
      }
    };

    loadDashboardData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    navigate("/admin/login");
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-lg hidden md:flex md:flex-col">
        <div className="px-6 py-6 border-b">
          <h1 className="text-2xl font-bold text-blue-600">
            Diagon Store
          </h1>

          <p className="text-xs text-gray-500 mt-1">
            Admin Panel
          </p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <button className="w-full text-left px-4 py-3 rounded-lg bg-blue-50 text-blue-600 font-medium">
            Dashboard
          </button>

          <button className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-100 text-gray-700">
            Products
          </button>

          <button className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-100 text-gray-700">
            Categories
          </button>

          <button className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-100 text-gray-700">
            Orders
          </button>

          <button className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-100 text-gray-700">
            Customers
          </button>

          <button className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-100 text-gray-700">
            Settings
          </button>
        </nav>

        <div className="p-4 border-t">
          <button
            onClick={handleLogout}
            className="w-full px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 text-left font-medium"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1">
        {/* Header */}
        <header className="bg-white shadow-sm px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">
              Dashboard
            </h2>

            <p className="text-sm text-gray-500">
              Welcome back, Admin
            </p>
          </div>

          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
            <span className="text-blue-600 font-bold">
              A
            </span>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="p-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Products */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <p className="text-sm text-gray-500">
                Total Products
              </p>

              <h3 className="text-3xl font-bold text-gray-800 mt-2">
                {productCount}
              </h3>
            </div>

            {/* Categories */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <p className="text-sm text-gray-500">
                Categories
              </p>

              <h3 className="text-3xl font-bold text-gray-800 mt-2">
                {categoryCount}
              </h3>
            </div>

            {/* Orders */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <p className="text-sm text-gray-500">
                Orders
              </p>

              <h3 className="text-3xl font-bold text-gray-800 mt-2">
                0
              </h3>
            </div>

            {/* Customers */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <p className="text-sm text-gray-500">
                Customers
              </p>

              <h3 className="text-3xl font-bold text-gray-800 mt-2">
                0
              </h3>
            </div>

          </div>

          {/* Store Overview */}
          <div className="mt-8 bg-white rounded-2xl shadow-sm p-6">
            <h3 className="text-xl font-semibold text-gray-800">
              Store Overview
            </h3>

            <p className="text-gray-500 mt-2">
              Manage your Diagon Store products, categories, orders,
              customers and store settings from this admin panel.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}

export default AdminDashboard;