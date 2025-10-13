import React, { useState, useRef, useEffect } from 'react';
import { X, Search } from 'lucide-react';
import type { Customer } from '../../types/database';

interface CustomerAutocompleteProps {
  customers: Customer[];
  selectedCustomer: Customer | null;
  onSelect: (customer: Customer | null) => void;
  placeholder?: string;
  isLoading?: boolean;
}

const CustomerAutocomplete: React.FC<CustomerAutocompleteProps> = ({
  customers,
  selectedCustomer,
  onSelect,
  placeholder = 'Søk etter kunde...',
  isLoading = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter customers based on search term
  const filteredCustomers = customers.filter(customer => 
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (customer.customer_number && customer.customer_number.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Debug logging
  useEffect(() => {
    if (searchTerm && searchTerm.length > 0) {
      console.log('🔍 Autocomplete search:', {
        searchTerm,
        totalCustomers: customers.length,
        filteredCount: filteredCustomers.length,
        filteredNames: filteredCustomers.map(c => c.name).slice(0, 5)
      });
    }
  }, [searchTerm, filteredCustomers.length, customers.length]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (customer: Customer) => {
    onSelect(customer);
    setSearchTerm('');
    setIsOpen(false);
  };

  const handleClear = () => {
    onSelect(null);
    setSearchTerm('');
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const handleInputChange = (value: string) => {
    setSearchTerm(value);
    setIsOpen(value.length > 0);
  };

  return (
    <div className="relative" ref={wrapperRef}>
      {/* Input Field */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <Search size={16} style={{ color: 'rgb(var(--muted-foreground))' }} />
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={selectedCustomer ? selectedCustomer.name : searchTerm}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => {
            if (!selectedCustomer && searchTerm) {
              setIsOpen(true);
            }
          }}
          placeholder={placeholder}
          className="w-full pl-9 pr-9 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          style={{ 
            border: '1px solid rgb(var(--border))',
            backgroundColor: 'rgb(var(--background))',
            color: 'rgb(var(--foreground))'
          }}
          disabled={!!selectedCustomer}
        />

        {/* Clear button */}
        {(selectedCustomer || searchTerm) && (
          <button
            onClick={handleClear}
            className="absolute inset-y-0 right-0 flex items-center pr-3 transition-colors"
            style={{ color: 'rgb(var(--muted-foreground))' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'rgb(var(--foreground))';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'rgb(var(--muted-foreground))';
            }}
            title="Tøm søk"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Selected customer badge */}
      {selectedCustomer && (
        <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm"
          style={{ 
            backgroundColor: 'rgb(var(--muted))',
            border: '1px solid rgb(var(--border))',
            color: 'rgb(var(--foreground))'
          }}>
          <span className="font-medium">{selectedCustomer.name}</span>
          {selectedCustomer.customer_number && (
            <span className="text-xs" style={{ color: 'rgb(var(--muted-foreground))' }}>
              ({selectedCustomer.customer_number})
            </span>
          )}
        </div>
      )}

      {/* Loading indicator */}
      {isLoading && (
        <div className="mt-2 text-xs" style={{ color: 'rgb(var(--muted-foreground))' }}>
          Laster kunder... ({customers.length} lastet)
        </div>
      )}

      {/* Debug info */}
      {customers.length === 0 && !isLoading && (
        <div className="mt-2 text-xs text-red-600">
          ⚠️ Ingen kunder lastet fra database
        </div>
      )}

      {/* Success indicator */}
      {!isLoading && customers.length > 0 && (
        <div className="mt-2 text-xs" style={{ color: 'rgb(var(--green-600))' }}>
          ✅ {customers.length} kunder lastet fra database
        </div>
      )}

      {/* Dropdown suggestions */}
      {isOpen && !selectedCustomer && (
        <div 
          className="absolute z-50 w-full mt-1 rounded-lg shadow-lg overflow-hidden"
          style={{ 
            backgroundColor: 'rgb(var(--card))',
            border: '1px solid rgb(var(--border))',
            maxHeight: '300px'
          }}
        >
          {isLoading ? (
            <div className="px-4 py-3 text-sm text-center" style={{ color: 'rgb(var(--muted-foreground))' }}>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 mx-auto mb-2" 
                style={{ borderColor: 'rgb(var(--orange-primary))' }}></div>
              Laster kunder...
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="px-4 py-3 text-sm text-center" style={{ color: 'rgb(var(--muted-foreground))' }}>
              Ingen kunder funnet for "{searchTerm}"
            </div>
          ) : (
            <div className="overflow-y-auto" style={{ maxHeight: '300px' }}>
              {filteredCustomers.map((customer, index) => (
                <button
                  key={customer.id}
                  onClick={() => handleSelect(customer)}
                  className="w-full px-4 py-3 text-left transition-colors"
                  style={{ 
                    borderTop: index > 0 ? `1px solid rgb(var(--border))` : 'none',
                    color: 'rgb(var(--foreground))'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgb(var(--muted))';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <div className="font-medium text-sm">{customer.name}</div>
                  {customer.customer_number && (
                    <div className="text-xs mt-1" style={{ color: 'rgb(var(--muted-foreground))' }}>
                      Kundenr: {customer.customer_number}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
          
          {/* Show count */}
          {filteredCustomers.length > 0 && (
            <div 
              className="px-4 py-2 text-xs text-center"
              style={{ 
                backgroundColor: 'rgb(var(--muted))',
                borderTop: '1px solid rgb(var(--border))',
                color: 'rgb(var(--muted-foreground))'
              }}
            >
              {filteredCustomers.length} kunde{filteredCustomers.length !== 1 ? 'r' : ''} funnet
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CustomerAutocomplete;

