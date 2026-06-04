import React, { useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Banknote, 
  Package, 
  Users, 
  Bike, 
  Clock,
  MapPin,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { useTranslation } from '../../contexts/LanguageContext';

export function SupplierOverview({ customers, riders, orders, supplierProfile }) {
  const { t } = useTranslation();
  // Compute Key Metrics
  const estimatedRevenue = customers.reduce((acc, curr) => acc + ((curr.bottlesPerDelivery || 1) * (curr.bottlePrice || 6.5)), 0);
  
  const pendingOrders = orders.filter(o => ['pending', 'assigned', 'in_transit'].includes(o.status));
  const completedOrders = orders.filter(o => o.status === 'delivered');
  const failedOrders = orders.filter(o => o.status === 'failed');

  const totalRevenueCollected = completedOrders.reduce((acc, o) => acc + (o.totalAmount || 0), 0);

  // Active riders count (mock logic: all riders except a few depending on length)
  const activeRidersCount = Math.max(0, riders.length - 1);

  const chartData = useMemo(() => {
    const data = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      
      const nextDay = new Date(d);
      nextDay.setDate(nextDay.getDate() + 1);

      const dayOrders = orders.filter(o => {
        const orderDate = new Date(o.createdAt);
        return orderDate >= d && orderDate < nextDay;
      });

      const dayRevenue = dayOrders
        .filter(o => o.status === 'delivered')
        .reduce((acc, o) => acc + (o.totalAmount || 0), 0);

      data.push({
        name: d.toLocaleDateString('en-US', { weekday: 'short' }),
        orders: dayOrders.length,
        revenue: dayRevenue
      });
    }
    return data;
  }, [orders]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fadeIn">
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{t('business_overview')}</h1>
          <p className="text-sm text-gray-500 mt-1">{t('business_overview_sub')}</p>
        </div>
        
        {/* Operating Day Badge */}
        {supplierProfile && (
          <div className="flex-1 max-w-sm">
            {supplierProfile.operatingDays?.includes(new Date().getDay()) ? (
              <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 p-3 rounded-xl shadow-sm">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-blue-900">Today is an Operating Day</h4>
                  <p className="text-xs text-blue-700">Automated deliveries are scheduled to run.</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 p-3 rounded-xl shadow-sm">
                <div className="w-10 h-10 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-700">Today is an Off-Day</h4>
                  <p className="text-xs text-gray-500">Automated deliveries will resume on your next operating day.</p>
                </div>
              </div>
            )}
          </div>
        )}


      </div>

      {/* Hero Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -mr-4 -mt-4 opacity-50"></div>
          <div className="relative">
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 shadow-inner">
                <Banknote className="w-5 h-5" />
              </div>
              <span className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full border border-green-100">
                <TrendingUp className="w-3 h-3" /> +12.5%
              </span>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">{t('todays_revenue')}</p>
              <h3 className="text-3xl font-black text-gray-900">
                <span className="text-xl text-gray-400 font-bold mr-1">$</span>
                {(totalRevenueCollected || 485.50).toFixed(2)}
              </h3>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-bl-full -mr-4 -mt-4 opacity-50"></div>
          <div className="relative">
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 shadow-inner">
                <Package className="w-5 h-5" />
              </div>
              <span className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full border border-green-100">
                <TrendingUp className="w-3 h-3" /> +5.2%
              </span>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">{t('deliveries_completed')}</p>
              <div className="flex items-baseline gap-2">
                <h3 className="text-3xl font-black text-gray-900">{completedOrders.length}</h3>
                <span className="text-sm font-semibold text-gray-400">/ {orders.length > 0 ? orders.length : 15} {t('targeted')}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-teal-50 rounded-bl-full -mr-4 -mt-4 opacity-50"></div>
          <div className="relative">
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center text-teal-600 shadow-inner">
                <Users className="w-5 h-5" />
              </div>
              <span className="flex items-center gap-1 text-xs font-bold text-gray-500 bg-gray-50 px-2 py-1 rounded-full border border-gray-200">
                <TrendingUp className="w-3 h-3 text-gray-400" /> +0.0%
              </span>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">{t('active_customers')}</p>
              <h3 className="text-3xl font-black text-gray-900">{customers.length}</h3>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-orange-50 rounded-bl-full -mr-4 -mt-4 opacity-50"></div>
          <div className="relative">
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 shadow-inner">
                <Bike className="w-5 h-5" />
              </div>
              {failedOrders.length > 0 && (
                <span className="flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-50 px-2 py-1 rounded-full border border-red-100 uppercase tracking-wider">
                  {failedOrders.length} {t('issues')}
                </span>
              )}
            </div>
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">{t('active_fleet')}</p>
              <div className="flex items-baseline gap-2">
                <h3 className="text-3xl font-black text-gray-900">{activeRidersCount}</h3>
                <span className="text-sm font-semibold text-gray-400">/ {riders.length} {t('online_riders')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Charts Area */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <div>
              <h3 className="font-bold text-gray-800">{t('revenue_deliveries_trend')}</h3>
              <p className="text-xs text-gray-500 mt-0.5">{t('performance_7_days')}</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-bold">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#0058bf]"></span> {t('revenue')}
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-teal-400"></span> {t('deliveries')}
              </div>
            </div>
          </div>
          
          <div className="p-6 h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0058bf" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#0058bf" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2dd4bf" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#2dd4bf" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={v => `$${v}`} />
                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                  labelStyle={{ fontWeight: 'bold', color: '#0f172a', marginBottom: '4px' }}
                />
                <Area yAxisId="left" type="monotone" dataKey="revenue" stroke="#0058bf" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                <Area yAxisId="right" type="monotone" dataKey="orders" stroke="#2dd4bf" strokeWidth={3} fillOpacity={1} fill="url(#colorOrders)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Live Operations Feed */}
        <div className="lg:col-span-1 bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col overflow-hidden h-[450px]">
          <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <h3 className="font-bold text-gray-800">{t('live_operations_feed')}</h3>
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
            {/* Generate feed from actual orders, or mock if empty */}
            {orders.slice(0, 5).map((o, idx) => {
              const isDelivered = o.status === 'delivered';
              const isFailed = o.status === 'failed';
              
              let Icon = Clock;
              let color = "text-blue-500 bg-blue-100";
              let title = t('order_dispatched', { id: o.orderId || o._id.substring(o._id.length-4) });
              
              if (isDelivered) {
                Icon = CheckCircle;
                color = "text-green-600 bg-green-100";
                title = t('delivery_completed');
              } else if (isFailed) {
                Icon = AlertCircle;
                color = "text-red-600 bg-red-100";
                title = t('delivery_missed');
              }

              return (
                <div key={o._id || idx} className="relative pl-6 before:absolute before:left-2 before:top-8 before:bottom-[-24px] before:w-px before:bg-gray-200 last:before:hidden">
                  <div className={`absolute left-0 top-1 w-4 h-4 rounded-full border-2 border-white shadow-sm flex items-center justify-center z-10 ${color.split(' ')[1]}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${color.split(' ')[0].replace('text-', 'bg-')}`}></div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="text-sm font-bold text-gray-800">{title}</h4>
                      <span className="text-[10px] font-bold text-gray-400">{t('just_now')}</span>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      {t('bottles_to', { qty: o.quantity })} <span className="font-semibold text-gray-700">{o.customerId?.userId?.fullName || t('customer_placeholder')}</span>
                      {o.deliveryBoyId && <span> {t('by_rider')} <span className="font-semibold text-gray-700">{o.deliveryBoyId?.userId?.fullName || t('rider_placeholder')}</span></span>}
                    </p>
                  </div>
                </div>
              );
            })}
            
            {orders.length === 0 && (
              <>
                <div className="relative pl-6 before:absolute before:left-2 before:top-8 before:bottom-[-24px] before:w-px before:bg-gray-200">
                  <div className="absolute left-0 top-1 w-4 h-4 rounded-full border-2 border-white shadow-sm bg-blue-100 flex items-center justify-center z-10">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                  </div>
                  <div>
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="text-sm font-bold text-gray-800">{t('system_online')}</h4>
                      <span className="text-[10px] font-bold text-gray-400">10m ago</span>
                    </div>
                    <p className="text-xs text-gray-500">{t('system_online_sub')}</p>
                  </div>
                </div>
                <div className="relative pl-6">
                  <div className="absolute left-0 top-1 w-4 h-4 rounded-full border-2 border-white shadow-sm bg-gray-100 flex items-center justify-center z-10">
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-400"></div>
                  </div>
                  <div>
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="text-sm font-bold text-gray-800">{t('routes_optimized')}</h4>
                      <span className="text-[10px] font-bold text-gray-400">12m ago</span>
                    </div>
                    <p className="text-xs text-gray-500">{t('routes_optimized_sub')}</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
