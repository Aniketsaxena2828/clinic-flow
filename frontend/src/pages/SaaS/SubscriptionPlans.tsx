import React, { useState, useEffect } from 'react';
import { Check } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export const SubscriptionPlans: React.FC = () => {
  const { clinic, switchTenantClinic } = useAuth();
  const [subData, setSubData] = useState<any>(null);

  useEffect(() => {
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    try {
      const res = await api.get('/saas/subscription');
      if (res.data?.data) {
        setSubData(res.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpgrade = async (plan: string) => {
    try {
      const res = await api.put('/saas/subscription', { plan });
      if (res.data?.data) {
        switchTenantClinic(res.data.data);
        fetchSubscription();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const plans = [
    {
      name: 'Free',
      price: '₹0',
      period: 'Forever free',
      doctors: '2 Doctors max',
      patients: '100 Patients max',
      features: ['Basic Scheduling', 'Single Clinic', '1GB Storage']
    },
    {
      name: 'Pro',
      price: '₹2,499',
      period: 'per month',
      doctors: '10 Doctors max',
      patients: '5,000 Patients max',
      popular: true,
      features: ['Rx PDF Generator', 'GST Invoicing', 'Pharmacy Inventory', 'Multi-Branch Support', '50GB Storage']
    },
    {
      name: 'Enterprise',
      price: '₹7,999',
      period: 'per month',
      doctors: 'Unlimited Doctors',
      patients: 'Unlimited Patients',
      features: ['Dedicated Account Manager', 'Custom API Integrations', 'AI Prescription Summaries', '500GB Storage', '24/7 SLA Support']
    }
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in-scale font-sans text-[#0F172A]">
      <div className="text-center space-y-2">
        <span className="px-3.5 py-1 rounded-full bg-blue-50 text-[#2563EB] border border-blue-200 text-xs font-mono font-bold uppercase tracking-wider">
          Active Tier: {clinic?.subscriptionPlan || 'Pro'}
        </span>
        <h2 className="text-3xl font-serif font-bold text-[#0F172A]">SaaS Subscription Plans</h2>
        <p className="text-xs text-slate-500">Scale your outpatient clinic operations with flexible tenant tiers</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        {plans.map((p) => {
          const isCurrent = subData?.currentPlan === p.name;
          return (
            <div
              key={p.name}
              className={`glass-panel p-7 rounded-2xl border relative flex flex-col justify-between transition-all bg-white ${
                p.popular
                  ? 'border-[#2563EB] shadow-xl shadow-blue-500/10'
                  : 'border-slate-200/90'
              }`}
            >
              {p.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-[#2563EB] text-white font-mono font-bold text-[10px] uppercase tracking-widest shadow-sm">
                  Most Popular
                </span>
              )}

              <div>
                <h3 className="text-xl font-serif font-bold text-[#0F172A]">{p.name}</h3>
                <div className="mt-3 flex items-baseline">
                  <span className="text-3xl font-serif font-bold text-[#0F172A] font-mono">{p.price}</span>
                  <span className="text-xs text-slate-500 ml-1.5">{p.period}</span>
                </div>

                <div className="mt-6 space-y-2.5 text-xs text-slate-700">
                  <p className="font-bold text-[#0F172A]">{p.doctors}</p>
                  <p className="font-bold text-[#0F172A]">{p.patients}</p>
                  <div className="pt-3 border-t border-slate-100 space-y-2">
                    {p.features.map((feat, i) => (
                      <div key={i} className="flex items-center space-x-2">
                        <Check className="w-4 h-4 text-[#2563EB] shrink-0" />
                        <span className="font-medium text-slate-600">{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <button
                  disabled={isCurrent}
                  onClick={() => handleUpgrade(p.name)}
                  className={`w-full py-2.5 rounded-xl font-bold text-xs transition cursor-pointer ${
                    isCurrent
                      ? 'bg-slate-100 text-slate-400 cursor-default border border-slate-200'
                      : 'btn-gold shadow-md bg-[#2563EB] text-white'
                  }`}
                >
                  {isCurrent ? 'Current Active Plan' : `Upgrade to ${p.name}`}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
