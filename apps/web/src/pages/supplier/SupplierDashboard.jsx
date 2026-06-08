import { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import { api } from "../../api/client";
import { StatCard } from "../../components/StatCard";
import { AddCustomerModal } from "../../components/supplier/modals/AddCustomerModal";
import { AddRiderModal } from "../../components/supplier/modals/AddRiderModal";
import { UpdateCustomerModal } from "../../components/supplier/modals/UpdateCustomerModal";
import { UpdateRiderModal } from "../../components/supplier/modals/UpdateRiderModal";
import { RiderCustomersModal } from "../../components/supplier/modals/RiderCustomersModal";
import { GenerateInvoiceModal } from "../../components/supplier/modals/GenerateInvoiceModal";
import { FilterDeliveriesModal } from "../../components/supplier/modals/FilterDeliveriesModal";
import { CustomerManagement } from "../../components/supplier/CustomerManagement";
import { RiderManagement } from "../../components/supplier/RiderManagement";
import { DeliveriesLog } from "../../components/supplier/DeliveriesLog";
import { InvoicesManagement } from "../../components/supplier/InvoicesManagement";
import { SupplierPayments } from "../../components/supplier/SupplierPayments";
import { SupplierOverview } from "../../components/supplier/SupplierOverview";
import { SupplierSubscription } from "./SupplierSubscription";
import { ProductManagement } from "../../components/supplier/ProductManagement";
import { SupplierDispatchBoard } from "../../components/supplier/SupplierDispatchBoard";
import { Bike, Plus, AlertTriangle, Users, Banknote, CheckCircle, Key, Lock, MessageCircle, X, MapPin, Package, RefreshCw, CalendarDays, Receipt, Filter, Truck } from "lucide-react";
import { useTranslation } from "../../contexts/LanguageContext";

// Water drop SVG icon
function DropIcon({ size = 20, color = "#1d4ed8" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2C12 2 5 10.5 5 15a7 7 0 0 0 14 0C19 10.5 12 2 12 2Z" />
    </svg>
  );
}

const statusColors = {
  active: "bg-green-50 text-green-700 border border-green-100",
  inactive: "bg-gray-50 text-gray-500 border border-gray-200",
  paused: "bg-orange-50 text-orange-700 border border-orange-100",
  blocked: "bg-red-50 text-red-700 border border-red-100"
};

export function SupplierDashboard({ user, activeTab }) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState([]);
  const [riders, setRiders] = useState([]);
  const [orders, setOrders] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [error, setError] = useState("");
  const [supplierProfile, setSupplierProfile] = useState(null);
  const socketRef = useRef(null);
  
  // Sub-tabs handled directly by activeTab now from layout 

  // Modals state
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showRiderModal, setShowRiderModal] = useState(false);
  
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  
  const [showGenerateInvoiceModal, setShowGenerateInvoiceModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);

  const [selectedRider, setSelectedRider] = useState(null);
  const [showUpdateRiderModal, setShowUpdateRiderModal] = useState(false);
  const [showRiderCustomersModal, setShowRiderCustomersModal] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // Form states are now managed internally by the Modal components.
  // We still need the API submit handlers though.

  async function loadData(showLoadingIndicator = false) {
    try {
      if (showLoadingIndicator || (customers.length === 0 && invoices.length === 0)) {
        setLoading(true);
      }
      setError("");
      
      const [custRes, riderRes, orderRes, supplierRes, invoiceRes] = await Promise.all([
        api.get("/suppliers/customers"),
        api.get("/suppliers/riders"),
        api.get(`/orders/supplier?startDate=${new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()}&endDate=${new Date().toISOString()}`).catch(() => ({ data: { data: [] } })),
        api.get("/suppliers/me").catch(() => ({ data: { data: null } })),
        api.get("/invoices").catch(() => ({ data: { data: [] } }))
      ]);
      
      setCustomers(custRes.data.data || []);
      setRiders(riderRes.data.data || []);
      setOrders(orderRes.data.data || []);
      setInvoices(invoiceRes.data.data || []);
      
      const profile = supplierRes.data.data;
      if (profile) {
        setSupplierProfile(profile);
      }
    } catch (err) {
      setError("Failed to sync data with server. Ensure you are signed in.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // Setup WebSockets
  useEffect(() => {
    if (supplierProfile && supplierProfile._id) {
      const socket = io("http://localhost:5000", {
        withCredentials: true,
      });
      socketRef.current = socket;

      socket.emit("join_supplier_room", supplierProfile._id);

      socket.on("orderCreated", () => loadData());
      socket.on("orderUpdated", () => loadData());
      socket.on("orderAssigned", () => loadData());
      socket.on("customerUpdated", () => loadData());

      return () => {
        socket.disconnect();
      };
    }
  }, [supplierProfile?._id]);

  // Modal states handle their own changes/generators now.

  async function handleAddCustomer(formData) {
    setFormError("");
    setSubmitting(true);
    try {
      await api.post("/suppliers/customers", {
        ...formData,
        bottlePrice: parseFloat(formData.bottlePrice),
        bottlesPerDelivery: parseInt(formData.bottlesPerDelivery) || 4,
        whatsappPhone: formData.phone
      });
      setShowCustomerModal(false);
      loadData();
    } catch (err) {
      setFormError(err.response?.data?.message || "Failed to create customer.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAddRider(formData) {
    setFormError("");
    setSubmitting(true);
    try {
      await api.post("/suppliers/riders", formData);
      setShowRiderModal(false);
      loadData();
    } catch (err) {
      setFormError(err.response?.data?.message || "Failed to create rider.");
    } finally {
      setSubmitting(false);
    }
  }

  const handleUpdateCustomer = async (customerId, updatedData) => {
    setFormError("");
    setSubmitting(true);
    try {
      await api.put(`/suppliers/customers/${customerId}`, updatedData);
      setShowUpdateModal(false);
      loadData();
    } catch (err) {
      setFormError(err.response?.data?.message || "Failed to update customer.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCustomer = async (customerId) => {
    try {
      await api.delete(`/suppliers/customers/${customerId}`);
      setShowUpdateModal(false);
      loadData();
    } catch (err) {
      setFormError(err.response?.data?.message || "Failed to delete customer.");
    }
  };

  const handleUpdateCustomerStatus = async (customerId, newStatus) => {
    try {
      await api.put(`/suppliers/customers/${customerId}`, { status: newStatus });
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update status");
    }
  };

  const handleAssignRiderToCustomer = async (customerId, riderId) => {
    try {
      await api.put(`/suppliers/customers/${customerId}`, { deliveryBoyId: riderId || null });
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to assign rider");
    }
  };

  const handleUpdateRider = async (riderId, updatedData) => {
    setFormError("");
    setSubmitting(true);
    try {
      await api.put(`/suppliers/riders/${riderId}`, updatedData);
      setShowUpdateRiderModal(false);
      loadData();
    } catch (err) {
      setFormError(err.response?.data?.message || "Failed to update rider.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateRiderStatus = async (riderId, isActive) => {
    try {
      await api.put(`/suppliers/riders/${riderId}`, { isActive });
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update status");
    }
  };

  const handleDeleteRider = async (riderId) => {
    try {
      await api.delete(`/suppliers/riders/${riderId}`);
      setShowUpdateRiderModal(false);
      loadData();
    } catch (err) {
      setFormError(err.response?.data?.message || "Failed to delete rider.");
    }
  };

  const handleGenerateInvoice = async (invoiceData) => {
    setSubmitting(true);
    try {
      await api.post('/invoices', invoiceData);
      alert("Invoice generated successfully!");
      setShowGenerateInvoiceModal(false);
      loadData();
    } catch (err) {
      alert("Failed to generate invoice");
    } finally {
      setSubmitting(false);
    }
  };

  async function handleAssignRider(orderId, riderId) {
    if (!riderId) return;
    try {
      await api.put(`/orders/${orderId}/assign`, { deliveryBoyId: riderId });
      loadData();
    } catch (err) {
      alert("Failed to assign rider");
    }
  }



  // Configuration, Customers, Riders, Deliveries, Invoices are now separate components.
  // The old `renderConfig` function is removed completely.

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl text-sm flex gap-2">
          <AlertTriangle className="w-4 h-4 inline-block" /> {error}
        </div>
      )}

      {loading && !error && (
        <div className="py-20 text-center text-gray-400">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-500" />
          <p className="text-sm">Syncing latest data...</p>
        </div>
      )}

      {!loading && (
        <>
          {activeTab === 'overview' && <SupplierOverview customers={customers} riders={riders} orders={orders} supplierProfile={supplierProfile} />}
          {activeTab === 'routing' && (
            <SupplierDispatchBoard 
              riders={riders}
              onAssignRider={handleAssignRider}
            />
          )}
          
          {activeTab === 'customers' && (
            <CustomerManagement 
              customers={customers} 
              riders={riders} 
              onAddCustomer={() => { setFormError(""); setShowCustomerModal(true); }} 
              onUpdateCustomer={(c) => { setFormError(""); setSelectedCustomer(c); setShowUpdateModal(true); }}
              onDeleteCustomer={handleDeleteCustomer}
              onUpdateStatus={handleUpdateCustomerStatus}
              onAssignRider={handleAssignRiderToCustomer}
            />
          )}

          {activeTab === 'riders' && (
            <RiderManagement 
              riders={riders}
              customers={customers}
              onAddRider={() => { setFormError(""); setShowRiderModal(true); }}
              onUpdateRider={(r) => { setFormError(""); setSelectedRider(r); setShowUpdateRiderModal(true); }}
              onDeleteRider={handleDeleteRider}
              onUpdateStatus={handleUpdateRiderStatus}
              onViewCustomers={(r) => { setSelectedRider(r); setShowRiderCustomersModal(true); }}
            />
          )}

          {activeTab === 'deliveries' && (
            <DeliveriesLog 
              orders={orders}
              riders={riders}
              supplierProfile={supplierProfile}
              onUpdateSupplierProfile={async (data) => {
                try {
                  await api.put('/suppliers/me', data);
                  loadData();
                } catch (err) {
                  alert(err.response?.data?.message || "Failed to update supplier profile");
                }
              }}
              onFilter={() => setShowFilterModal(true)}
              onAssign={async (orderId, riderId) => {
                try {
                  await api.put(`/orders/${orderId}/assign`, { deliveryBoyId: riderId });
                  loadData();
                } catch (err) {
                  alert('Failed to assign rider');
                }
              }}
            />
          )}

          {activeTab === 'payments' && <SupplierPayments customers={customers} riders={riders} invoices={invoices} loadInvoices={loadData} supplierProfile={supplierProfile} />}

          {activeTab === 'products' && <ProductManagement />}

          {activeTab === 'subscription' && <SupplierSubscription user={user} />}
        </>
      )}

      {showCustomerModal && (
        <AddCustomerModal 
          onClose={() => setShowCustomerModal(false)}
          onSubmit={handleAddCustomer}
          riders={riders}
          submitting={submitting}
          formError={formError}
        />
      )}

      {showRiderModal && (
        <AddRiderModal 
          onClose={() => setShowRiderModal(false)}
          onSubmit={handleAddRider}
          submitting={submitting}
          formError={formError}
        />
      )}

      {showUpdateModal && selectedCustomer && (
        <UpdateCustomerModal 
          customer={selectedCustomer}
          onClose={() => setShowUpdateModal(false)}
          onUpdate={handleUpdateCustomer}
          onDelete={handleDeleteCustomer}
          riders={riders}
          submitting={submitting}
          formError={formError}
        />
      )}

      {showUpdateRiderModal && selectedRider && (
        <UpdateRiderModal 
          rider={selectedRider}
          onClose={() => setShowUpdateRiderModal(false)}
          onUpdate={handleUpdateRider}
          submitting={submitting}
          formError={formError}
        />
      )}

      {showRiderCustomersModal && selectedRider && (
        <RiderCustomersModal 
          rider={selectedRider}
          customers={customers}
          onClose={() => setShowRiderCustomersModal(false)}
        />
      )}

      {showGenerateInvoiceModal && (
        <GenerateInvoiceModal 
          customers={customers}
          onClose={() => setShowGenerateInvoiceModal(false)}
          onGenerate={handleGenerateInvoice}
          submitting={submitting}
        />
      )}

      {showFilterModal && (
        <FilterDeliveriesModal 
          onClose={() => setShowFilterModal(false)}
          onApply={(filters) => {
            console.log("Applied Filters: ", filters);
            setShowFilterModal(false);
          }}
        />
      )}
    </div>
  );
}
