import React from 'react';
import { Search, Filter, ArrowUpDown, Plus, X, RotateCcw } from 'lucide-react';

export interface FilterDropdownConfig {
  id: string;
  label?: string;
  value: string;
  onChange: (val: string) => void;
  options: Array<{ value: string; label: string }>;
  icon?: React.ReactNode;
}

export interface SortOptionConfig {
  value: string;
  label: string;
}

export interface AdminManagementToolbarProps {
  // Title & Header info (optional if parent renders custom header)
  title?: string;
  subtitle?: string;
  totalCount?: number;
  filteredCount?: number;
  itemLabel?: string;

  // [+ Add New] button config
  addNewButton?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
    disabled?: boolean;
    title?: string;
  };

  // Search input config
  search: {
    value: string;
    onChange: (val: string) => void;
    placeholder?: string;
  };

  // Filter dropdowns config
  filters?: FilterDropdownConfig[];

  // Sort dropdown config
  sort: {
    value: string;
    onChange: (val: string) => void;
    options: SortOptionConfig[];
    label?: string;
  };

  // Optional reset handler
  onResetFilters?: () => void;
  isFiltered?: boolean;
}

export const AdminManagementToolbar: React.FC<AdminManagementToolbarProps> = ({
  title,
  subtitle,
  totalCount,
  filteredCount,
  itemLabel = 'items',
  addNewButton,
  search,
  filters = [],
  sort,
  onResetFilters,
  isFiltered,
}) => {
  return (
    <div className="space-y-4">
      {/* Optional Top Section Header */}
      {(title || addNewButton) && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#232635] pb-5">
          {title && (
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl sm:text-2xl font-cinzel font-bold text-[#f5efeb]">
                  {title}
                </h2>
                {typeof totalCount === 'number' && (
                  <span className="px-2.5 py-0.5 bg-[#171924] border border-[#2b2e40] rounded-full text-xs font-cinzel text-[#c5a059]">
                    {totalCount} {itemLabel}
                  </span>
                )}
              </div>
              {subtitle && (
                <p className="text-xs text-[#8e887a] mt-0.5 leading-relaxed">
                  {subtitle}
                </p>
              )}
            </div>
          )}

          {addNewButton && (
            <button
              type="button"
              onClick={addNewButton.onClick}
              disabled={addNewButton.disabled}
              title={addNewButton.title}
              className="px-4 py-2.5 bg-[#c5a059] hover:bg-[#d6b169] text-[#0c0d12] text-xs font-cinzel font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-lg shadow-[#c5a059]/15 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed self-start sm:self-auto shrink-0"
            >
              {addNewButton.icon || <Plus className="w-4 h-4" />}
              <span>{addNewButton.label}</span>
            </button>
          )}
        </div>
      )}

      {/* Unified Management Controls Bar: [+ Add New (if not in header)] [Search] [Filter ▾] [Sort By ▾] */}
      <div className="p-3.5 bg-[#11131c] border border-[#232635] rounded-xl flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between shadow-sm">
        {/* Left cluster: Search field */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-[#8e887a] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search.value}
            onChange={(e) => search.onChange(e.target.value)}
            placeholder={search.placeholder || `Search ${itemLabel}...`}
            className="w-full pl-9 pr-8 py-2 bg-[#171924] border border-[#2b2e40] rounded-lg text-xs text-[#f5efeb] placeholder-[#6b665c] focus:outline-none focus:border-[#c5a059] transition-colors"
          />
          {search.value && (
            <button
              type="button"
              onClick={() => search.onChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-[#8e887a] hover:text-[#f5efeb] rounded-full transition-colors cursor-pointer"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Right cluster: Filter dropdown(s) and Sort By dropdown */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Dynamic Filter dropdowns */}
          {filters.map((filter) => (
            <div key={filter.id} className="relative flex items-center">
              <select
                value={filter.value}
                onChange={(e) => filter.onChange(e.target.value)}
                className="px-3 py-2 bg-[#171924] border border-[#2b2e40] hover:border-[#3d425c] rounded-lg text-xs text-[#dcd7cb] font-cinzel focus:outline-none focus:border-[#c5a059] cursor-pointer transition-colors pr-7 appearance-none"
              >
                {filter.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <div className="absolute right-2 pointer-events-none text-[#8e887a]">
                <Filter className="w-3 h-3" />
              </div>
            </div>
          ))}

          {/* Sort By dropdown */}
          <div className="relative flex items-center">
            <select
              value={sort.value}
              onChange={(e) => sort.onChange(e.target.value)}
              className="px-3 py-2 bg-[#171924] border border-[#2b2e40] hover:border-[#3d425c] rounded-lg text-xs text-[#c5a059] font-cinzel font-medium focus:outline-none focus:border-[#c5a059] cursor-pointer transition-colors pr-7 appearance-none"
              title="Sort items"
            >
              {sort.options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <div className="absolute right-2 pointer-events-none text-[#c5a059]">
              <ArrowUpDown className="w-3 h-3" />
            </div>
          </div>

          {/* Optional Reset Filters Button */}
          {isFiltered && onResetFilters && (
            <button
              type="button"
              onClick={onResetFilters}
              className="px-2.5 py-2 bg-[#1e2130] hover:bg-[#282c40] text-[#a8a396] hover:text-[#f5efeb] text-xs font-cinzel rounded-lg transition-colors flex items-center gap-1 cursor-pointer border border-[#2d3148]"
              title="Reset all filters and search"
            >
              <RotateCcw className="w-3 h-3" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}

          {/* Count feedback */}
          {typeof filteredCount === 'number' && typeof totalCount === 'number' && (
            <div className="text-[11px] text-[#7d776a] font-mono ml-1 hidden lg:block">
              {filteredCount} / {totalCount}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
