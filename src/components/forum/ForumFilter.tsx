import { useState } from 'react';
import { Filter, SortAsc, SortDesc, Clock, MessageSquare, Eye } from 'lucide-react';

export type SortOption = 'newest' | 'oldest' | 'most_replies' | 'most_views';
export type FilterOption = 'all' | 'today' | 'week' | 'month';

interface ForumFilterProps {
  sortBy: SortOption;
  filterBy: FilterOption;
  onSortChange: (sort: SortOption) => void;
  onFilterChange: (filter: FilterOption) => void;
}

export default function ForumFilter({ sortBy, filterBy, onSortChange, onFilterChange }: ForumFilterProps) {
  const [showFilters, setShowFilters] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setShowFilters(!showFilters)}
        className="flex items-center gap-2 px-3 py-2 bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-lg text-[hsl(var(--bc-text-muted))] hover:text-[hsl(var(--bc-text))] transition"
      >
        <Filter className="w-4 h-4" />
        <span className="text-sm">Filter & Sort</span>
      </button>

      {showFilters && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl shadow-xl z-20 p-4">
          {/* Sort Options */}
          <div className="mb-4">
            <label className="text-xs font-medium text-[hsl(var(--bc-text-muted))] uppercase mb-2 block">
              Sort By
            </label>
            <div className="space-y-1">
              <button
                onClick={() => onSortChange('newest')}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition ${
                  sortBy === 'newest' 
                    ? 'bg-[hsl(var(--bc-primary))] text-white' 
                    : 'hover:bg-[hsl(var(--bc-bg-light))] text-[hsl(var(--bc-text))]'
                }`}
              >
                <SortDesc className="w-4 h-4" />
                Newest First
              </button>
              <button
                onClick={() => onSortChange('oldest')}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition ${
                  sortBy === 'oldest' 
                    ? 'bg-[hsl(var(--bc-primary))] text-white' 
                    : 'hover:bg-[hsl(var(--bc-bg-light))] text-[hsl(var(--bc-text))]'
                }`}
              >
                <SortAsc className="w-4 h-4" />
                Oldest First
              </button>
              <button
                onClick={() => onSortChange('most_replies')}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition ${
                  sortBy === 'most_replies' 
                    ? 'bg-[hsl(var(--bc-primary))] text-white' 
                    : 'hover:bg-[hsl(var(--bc-bg-light))] text-[hsl(var(--bc-text))]'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                Most Replies
              </button>
              <button
                onClick={() => onSortChange('most_views')}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition ${
                  sortBy === 'most_views' 
                    ? 'bg-[hsl(var(--bc-primary))] text-white' 
                    : 'hover:bg-[hsl(var(--bc-bg-light))] text-[hsl(var(--bc-text))]'
                }`}
              >
                <Eye className="w-4 h-4" />
                Most Views
              </button>
            </div>
          </div>

          {/* Time Filter */}
          <div>
            <label className="text-xs font-medium text-[hsl(var(--bc-text-muted))] uppercase mb-2 block">
              Time Period
            </label>
            <div className="space-y-1">
              <button
                onClick={() => onFilterChange('all')}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition ${
                  filterBy === 'all' 
                    ? 'bg-[hsl(var(--bc-primary))] text-white' 
                    : 'hover:bg-[hsl(var(--bc-bg-light))] text-[hsl(var(--bc-text))]'
                }`}
              >
                <Clock className="w-4 h-4" />
                All Time
              </button>
              <button
                onClick={() => onFilterChange('today')}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition ${
                  filterBy === 'today' 
                    ? 'bg-[hsl(var(--bc-primary))] text-white' 
                    : 'hover:bg-[hsl(var(--bc-bg-light))] text-[hsl(var(--bc-text))]'
                }`}
              >
                Today
              </button>
              <button
                onClick={() => onFilterChange('week')}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition ${
                  filterBy === 'week' 
                    ? 'bg-[hsl(var(--bc-primary))] text-white' 
                    : 'hover:bg-[hsl(var(--bc-bg-light))] text-[hsl(var(--bc-text))]'
                }`}
              >
                This Week
              </button>
              <button
                onClick={() => onFilterChange('month')}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition ${
                  filterBy === 'month' 
                    ? 'bg-[hsl(var(--bc-primary))] text-white' 
                    : 'hover:bg-[hsl(var(--bc-bg-light))] text-[hsl(var(--bc-text))]'
                }`}
              >
                This Month
              </button>
            </div>
          </div>

          <button
            onClick={() => setShowFilters(false)}
            className="w-full mt-4 py-2 text-sm text-[hsl(var(--bc-text-muted))] hover:text-[hsl(var(--bc-text))] transition"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}
