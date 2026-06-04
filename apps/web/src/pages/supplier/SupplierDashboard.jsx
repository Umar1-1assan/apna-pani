import { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import { api } from "../../api/client";
import { StatCard } from "../../components/StatCard";
import { AddCustomerModal } from "../../components/supplier/modals/AddCustomerModal";
import { AddRiderModal } from "../../components/supplier/modals/AddRiderModal";
import { UpdateCustomerModal } from "../../components/supplier/modals/UpdateCustomerModal";
import { GenerateInvoiceModal } from "../../components/supplier/modals/GenerateInvoiceModal";
import { FilterDeliveriesModal } from "../../components/supplier/modals/FilterDeliveriesModal";
import { CustomerManagement } from "../../components/supplier/CustomerManagement";
import { RiderManagement } from "../../components/supplier/RiderManagement";
import { DeliveriesLog } from "../../components/supplier/DeliveriesLog";
import { InvoicesManagement } from "../../components/supplier/InvoicesManagement";
import { SupplierConfiguration } from "../../components/supplier/SupplierConfiguration";
import { SupplierOverview } from "../../components/supplier/SupplierOverview";
import { Bike, Plus, AlertTriangle, Users, Banknote, CheckCircle, Key, Lock, MessageCircle, X, MapPin, Package, RefreshCw, CalendarDays, Receipt, Filter } from "lucide-react";
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

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // Form states are now managed internally by the Modal components.
  // We still need the API submit handlers though.

  async function loadData() {
    try {
      setLoading(true);
      setError("");
      
      const [custRes, riderRes, orderRes, supplierRes, invoiceRes] = await Promise.all([
        api.get("/suppliers/customers"),
        api.get("/suppliers/riders"),
        api.get("/orders/supplier").catch(() => ({ data: { data: [] } })),
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
        monthlyBottles: parseInt(formData.monthlyBottles) || 4,
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



  const renderRouting = () => (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-fadeIn h-full flex flex-col">
      <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white">
        <div>
          <h2 className="font-bold text-gray-800 text-lg">{t('manual_dispatch_board')}</h2>
          <p className="text-xs text-gray-400 mt-0.5">{t('manual_dispatch_board_sub')}</p>
        </div>
        <div className="flex gap-2">
           <span className="bg-blue-100 text-blue-700 text-xs px-3 py-1.5 rounded-lg font-bold shadow-sm">
             {orders.filter(o => o.status === 'pending').length} {t('pending')}
           </span>
           <span className="bg-teal-100 text-teal-700 text-xs px-3 py-1.5 rounded-lg font-bold shadow-sm">
             {orders.filter(o => o.status === 'assigned').length} {t('assigned')}
           </span>
        </div>
      </div>
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-gray-50 text-gray-500 font-semibold border-b border-gray-100">
              <th className="px-6 py-4 uppercase tracking-wider text-[11px]">{t('order_no')}</th>
              <th className="px-6 py-4 uppercase tracking-wider text-[11px]">{t('customer_and_destination')}</th>
              <th className="px-6 py-4 uppercase tracking-wider text-[11px]">{t('order_details')}</th>
              <th className="px-6 py-4 uppercase tracking-wider text-[11px]">{t('billing')}</th>
              <th className="px-6 py-4 uppercase tracking-wider text-[11px]">{t('dispatch_assignment')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-gray-700">
            {orders.filter(o => ['pending', 'assigned'].includes(o.status)).map((o) => (
              <tr key={o._id} className="hover:bg-blue-50/30 transition-colors">
                <td className="px-6 py-4 font-mono font-bold text-gray-900 bg-gray-50/50">
                  {o.orderId || o._id.substring(o._id.length-6).toUpperCase()}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center shrink-0">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-800">{o.customerId?.userId?.fullName || t('walk_in_customer')}</p>
                      <p className="text-xs text-gray-500 font-medium max-w-[200px] truncate">{o.deliveryAddress}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-gray-800 bg-gray-100 px-2 py-0.5 rounded">{o.quantity}x</span>
                    <span className="text-sm font-semibold">{o.productType}</span>
                  </div>
                  <p className="text-xs text-orange-600 font-bold mt-1 flex items-center gap-1">
                    <CalendarDays className="w-3 h-3" /> {o.timeSlot.toUpperCase()}
                  </p>
                </td>
                <td className="px-6 py-4">
                  <p className="font-black text-gray-800 text-base">₨ {o.totalAmount || (o.quantity * 150)}</p>
                  <p className="text-[10px] uppercase font-bold text-gray-400 border border-gray-200 inline-block px-1.5 rounded mt-1">{o.paymentMethod}</p>
                </td>
                <td className="px-6 py-4">
                  {o.status === 'pending' ? (
                    <div className="relative">
                      <select 
                        className="w-full text-xs font-bold border-2 border-dashed border-blue-300 rounded-lg pl-3 pr-8 py-2.5 text-blue-700 bg-blue-50/50 hover:bg-blue-50 outline-none focus:border-blue-500 focus:bg-white transition-all appearance-none cursor-pointer shadow-sm"
                        onChange={(e) => handleAssignRider(o._id, e.target.value)}
                        defaultValue=""
                      >
                        <option value="" disabled>{t('assign_rider_placeholder')}</option>
                        {riders.map(r => (
                          <option key={r._id} value={r._id}>{r.userId?.fullName || r.areaName}</option>
                        ))}
                      </select>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-blue-500">
                        <Plus className="w-4 h-4" />
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-teal-100 text-teal-700 shadow-inner">
                        <Bike className="w-4 h-4" />
                      </span>
                      <div>
                        <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t('dispatched_to')}</span>
                        <span className="font-bold text-teal-700 text-sm">
                          {o.deliveryBoyId?.userId?.fullName || t('assigned')}
                        </span>
                      </div>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            
            {orders.filter(o => ['pending', 'assigned'].includes(o.status)).length === 0 && (
              <tr>
                <td colSpan="5" className="px-6 py-16 text-center text-gray-400">
                  <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-300" />
                  <p className="text-base font-bold text-gray-500">{t('dispatch_board_clear')}</p>
                  <p className="text-sm">{t('no_pending_orders_queue')}</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

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
          {activeTab === 'overview' && <SupplierOverview customers={customers} riders={riders} orders={orders} />}
          {activeTab === 'routing' && renderRouting()}
          
          {activeTab === 'customers' && (
            <CustomerManagement 
              customers={customers} 
              riders={riders} 
              onAddCustomer={() => setShowCustomerModal(true)} 
              onUpdateCustomer={(c) => { setSelectedCustomer(c); setShowUpdateModal(true); }}
              onDeleteCustomer={handleDeleteCustomer}
            />
          )}

          {activeTab === 'riders' && (
            <RiderManagement 
              riders={riders}
              onAddRider={() => setShowRiderModal(true)}
            />
          )}

          {activeTab === 'deliveries' && (
            <DeliveriesLog 
              orders={orders}
              riders={riders}
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

          {activeTab === 'invoices' && <InvoicesManagement customers={customers} riders={riders} invoices={invoices} onGenerateInvoice={() => setShowGenerateInvoiceModal(true)} />}

          {activeTab === 'config' && <SupplierConfiguration profileData={supplierProfile} onSave={loadData} />}
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
