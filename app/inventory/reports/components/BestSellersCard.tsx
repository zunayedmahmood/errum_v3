'use client';

import React, { useEffect, useState } from 'react';
import businessAnalyticsService, { TopProductRow } from '@/services/businessAnalyticsService';
import categoryService from '@/services/categoryService'; // Assuming this exists or I'll create/check it
import ReportCard from './ReportCard';
import LocalDatePicker from './LocalDatePicker';
import { Filter, Search } from 'lucide-react';

function currency(value: number) {
  return new Intl.NumberFormat('en-BD', { maximumFractionDigits: 0 }).format(Number(value || 0));
}

export default function BestSellersCard({ 
  initialData, 
  initialFilters 
}: { 
  initialData: TopProductRow[], 
  initialFilters: { from: string, to: string, store_id?: string | number } 
}) {
  const [data, setData] = useState<TopProductRow[]>(initialData);
  const [filters, setFilters] = useState(initialFilters);
  const [categories, setCategories] = useState<{id: number, name: string}[]>([]);
  const [categoryId, setCategoryId] = useState<string | number>('');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const fetchData = async (f = filters, cat = categoryId, min = minPrice, max = maxPrice) => {
    setLoading(true);
    try {
      const res = await businessAnalyticsService.getTopProducts({ 
        ...f, 
        category_id: cat,
        min_price: min ? Number(min) : undefined,
        max_price: max ? Number(max) : undefined
      });
      setData(res.data);
    } catch (error) {
      console.error('Failed to fetch top products:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    categoryService.getAll().then(res => setCategories(res.data)).catch(() => {});
  }, []);

  const handleDateChange = (from: string, to: string) => {
    const newFilters = { ...filters, from, to };
    setFilters(newFilters);
    fetchData(newFilters, categoryId, minPrice, maxPrice);
  };

  return (
    <ReportCard
      title="Best Sellers"
      subtitle="Top performing products by units and profit"
      isLoading={loading}
      onRefresh={() => fetchData()}
      headerAction={
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded-lg border transition-all ${showFilters ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-white border-gray-200 text-gray-600 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400'}`}
          >
            <Filter className="w-4 h-4" />
          </button>
          <LocalDatePicker from={filters.from} to={filters.to} onChange={handleDateChange} />
        </div>
      }
    >
      {showFilters && (
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl grid grid-cols-1 md:grid-cols-3 gap-4 border border-gray-100 dark:border-gray-700 animate-in fade-in slide-in-from-top-2">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Category</label>
            <select 
              value={categoryId} 
              onChange={(e) => { setCategoryId(e.target.value); fetchData(filters, e.target.value, minPrice, maxPrice); }}
              className="w-full text-sm rounded-lg border-gray-200 dark:border-gray-700 dark:bg-gray-900"
            >
              <option value="">All Categories</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Min Price</label>
            <input 
              type="number" 
              value={minPrice} 
              onChange={(e) => setMinPrice(e.target.value)}
              onBlur={() => fetchData(filters, categoryId, minPrice, maxPrice)}
              placeholder="e.g. 100"
              className="w-full text-sm rounded-lg border-gray-200 dark:border-gray-700 dark:bg-gray-900" 
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Max Price</label>
            <input 
              type="number" 
              value={maxPrice} 
              onChange={(e) => setMaxPrice(e.target.value)}
              onBlur={() => fetchData(filters, categoryId, minPrice, maxPrice)}
              placeholder="e.g. 5000"
              className="w-full text-sm rounded-lg border-gray-200 dark:border-gray-700 dark:bg-gray-900" 
            />
          </div>
        </div>
      )}

      <div className="overflow-x-auto -mx-6">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50/50 dark:bg-gray-800/30 text-gray-500 dark:text-gray-400">
              <th className="px-6 py-3 text-left font-semibold uppercase tracking-wider text-xs">Product Details</th>
              <th className="px-6 py-3 text-right font-semibold uppercase tracking-wider text-xs">Units</th>
              <th className="px-6 py-3 text-right font-semibold uppercase tracking-wider text-xs">Revenue</th>
              <th className="px-6 py-3 text-right font-semibold uppercase tracking-wider text-xs">Profit</th>
              <th className="px-6 py-3 text-right font-semibold uppercase tracking-wider text-xs">Stock</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {data.map((row) => (
              <tr key={row.product_id} className="hover:bg-gray-50/80 dark:hover:bg-gray-800/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-semibold text-gray-900 dark:text-white">{row.name}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{row.sku || 'No SKU'}</div>
                </td>
                <td className="px-6 py-4 text-right">
                  <span className="font-bold text-gray-900 dark:text-white">{row.units}</span>
                </td>
                <td className="px-6 py-4 text-right font-medium text-gray-900 dark:text-white">
                  {currency(row.revenue)}
                </td>
                <td className="px-6 py-4 text-right">
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">{currency(row.gross_profit)}</span>
                </td>
                <td className="px-6 py-4 text-right">
                  <span className={`px-2 py-1 rounded-md text-xs font-bold ${row.stock_on_hand <= 5 ? 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'}`}>
                    {row.stock_on_hand}
                  </span>
                </td>
              </tr>
            ))}
            {data.length === 0 && !loading && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">No products found matching the criteria</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </ReportCard>
  );
}
